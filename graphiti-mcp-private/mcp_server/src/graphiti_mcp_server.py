#!/usr/bin/env python3
"""
Graphiti MCP Server - Exposes Graphiti functionality through the Model Context Protocol (MCP)
"""

import argparse
import asyncio
import logging
import os
import sys
from pathlib import Path
from typing import Any, Optional

from dotenv import load_dotenv
from graphiti_core import Graphiti
from graphiti_core.edges import EntityEdge
from graphiti_core.nodes import EpisodeType, EpisodicNode
from graphiti_core.search.search_filters import (
    SearchFilters,
    DateFilter,
    ComparisonOperator,
)
from graphiti_core.search.search_config_recipes import (
    EDGE_HYBRID_SEARCH_RRF,
    EDGE_HYBRID_SEARCH_NODE_DISTANCE,
    NODE_HYBRID_SEARCH_RRF,
    COMBINED_HYBRID_SEARCH_RRF,
)
from graphiti_core.utils.maintenance.graph_data_operations import clear_data
from mcp.server.fastmcp import FastMCP
from mcp.server.transport_security import TransportSecuritySettings
from pydantic import BaseModel
from starlette.responses import JSONResponse

from config.schema import GraphitiConfig, ServerConfig
from models.response_types import (
    CommunityBuildResponse,
    CommunityResult,
    EpisodeContentResponse,
    EpisodeSearchResponse,
    ErrorResponse,
    FactSearchResponse,
    NodeResult,
    NodeSearchResponse,
    StatusResponse,
    SuccessResponse,
    TemporalFactSearchResponse,
)
from services.factories import DatabaseDriverFactory, EmbedderFactory, LLMClientFactory
from services.queue_service import QueueService
from utils.formatting import format_fact_result

# Load .env file from mcp_server directory
mcp_server_dir = Path(__file__).parent.parent
env_file = mcp_server_dir / '.env'
if env_file.exists():
    load_dotenv(env_file)
else:
    # Try current working directory as fallback
    load_dotenv()


# Semaphore limit for concurrent Graphiti operations.
#
# This controls how many episodes can be processed simultaneously. Each episode
# processing involves multiple LLM calls (entity extraction, deduplication, etc.),
# so the actual number of concurrent LLM requests will be higher.
#
# TUNING GUIDELINES:
#
# LLM Provider Rate Limits (requests per minute):
# - OpenAI Tier 1 (free):     3 RPM   -> SEMAPHORE_LIMIT=1-2
# - OpenAI Tier 2:            60 RPM   -> SEMAPHORE_LIMIT=5-8
# - OpenAI Tier 3:           500 RPM   -> SEMAPHORE_LIMIT=10-15
# - OpenAI Tier 4:         5,000 RPM   -> SEMAPHORE_LIMIT=20-50
# - Anthropic (default):     50 RPM   -> SEMAPHORE_LIMIT=5-8
# - Anthropic (high tier): 1,000 RPM   -> SEMAPHORE_LIMIT=15-30
# - Azure OpenAI (varies):  Consult your quota -> adjust accordingly
#
# SYMPTOMS:
# - Too high: 429 rate limit errors, increased costs from parallel processing
# - Too low: Slow throughput, underutilized API quota
#
# MONITORING:
# - Watch logs for rate limit errors (429)
# - Monitor episode processing times
# - Check LLM provider dashboard for actual request rates
#
# DEFAULT: 10 (suitable for OpenAI Tier 3, mid-tier Anthropic)
SEMAPHORE_LIMIT = int(os.getenv('SEMAPHORE_LIMIT', 10))


# Configure structured logging with timestamps
LOG_FORMAT = '%(asctime)s - %(name)s - %(levelname)s - %(message)s'
DATE_FORMAT = '%Y-%m-%d %H:%M:%S'

logging.basicConfig(
    level=logging.INFO,
    format=LOG_FORMAT,
    datefmt=DATE_FORMAT,
    stream=sys.stderr,
)

# Configure specific loggers
logging.getLogger('uvicorn').setLevel(logging.INFO)
logging.getLogger('uvicorn.access').setLevel(logging.WARNING)  # Reduce access log noise
logging.getLogger('mcp.server.streamable_http_manager').setLevel(
    logging.WARNING
)  # Reduce MCP noise


# Patch uvicorn's logging config to use our format
def configure_uvicorn_logging():
    """Configure uvicorn loggers to match our format after they're created."""
    for logger_name in ['uvicorn', 'uvicorn.error', 'uvicorn.access']:
        uvicorn_logger = logging.getLogger(logger_name)
        # Remove existing handlers and add our own with proper formatting
        uvicorn_logger.handlers.clear()
        handler = logging.StreamHandler(sys.stderr)
        handler.setFormatter(logging.Formatter(LOG_FORMAT, datefmt=DATE_FORMAT))
        uvicorn_logger.addHandler(handler)
        uvicorn_logger.propagate = False


logger = logging.getLogger(__name__)

# Create global config instance - will be properly initialized later
config: GraphitiConfig

# MCP server instructions
GRAPHITI_MCP_INSTRUCTIONS = """
Graphiti is a memory service for AI agents built on a knowledge graph. Graphiti performs well
with dynamic data such as user interactions, changing enterprise data, and external information.

Graphiti transforms information into a richly connected knowledge network, allowing you to 
capture relationships between concepts, entities, and information. The system organizes data as episodes 
(content snippets), nodes (entities), and facts (relationships between entities), creating a dynamic, 
queryable memory store that evolves with new information. Graphiti supports multiple data formats, including 
structured JSON data, enabling seamless integration with existing data pipelines and systems.

Facts contain temporal metadata, allowing you to track the time of creation and whether a fact is invalid 
(superseded by new information).

Key capabilities:
1. Add episodes (text, messages, or JSON) to the knowledge graph with the add_memory tool
2. Search for nodes (entities) in the graph using natural language queries with search_nodes
3. Find relevant facts (relationships between entities) with search_facts
4. Retrieve specific entity edges or episodes by UUID
5. Manage the knowledge graph with tools like delete_episode, delete_entity_edge, and clear_graph

The server connects to a database for persistent storage and uses language models for certain operations. 
Each piece of information is organized by group_id, allowing you to maintain separate knowledge domains.

When adding information, provide descriptive names and detailed content to improve search quality. 
When searching, use specific queries and consider filtering by group_id for more relevant results.

For optimal performance, ensure the database is properly configured and accessible, and valid 
API keys are provided for any language model operations.
"""

# MCP server instance with transport security configured for Docker
# Allow both localhost (direct access) and Docker container name (MetaMCP gateway)
mcp = FastMCP(
    'Graphiti Agent Memory',
    instructions=GRAPHITI_MCP_INSTRUCTIONS,
    transport_security=TransportSecuritySettings(
        enable_dns_rebinding_protection=True,
        allowed_hosts=[
            '127.0.0.1:*',
            'localhost:*',
            '[::1]:*',
            'emily-graphiti:*',  # Docker container name for MetaMCP gateway
        ],
    ),
)

# Global services
graphiti_service: Optional['GraphitiService'] = None
queue_service: QueueService | None = None

# Global client for backward compatibility
graphiti_client: Graphiti | None = None
semaphore: asyncio.Semaphore


class GraphitiService:
    """Graphiti service using the unified configuration system."""

    def __init__(self, config: GraphitiConfig, semaphore_limit: int = 10):
        self.config = config
        self.semaphore_limit = semaphore_limit
        self.semaphore = asyncio.Semaphore(semaphore_limit)
        self.client: Graphiti | None = None
        self.entity_types = None

    async def initialize(self) -> None:
        """Initialize the Graphiti client with factory-created components."""
        try:
            # Create clients using factories
            llm_client = None
            embedder_client = None

            # Create LLM client based on configured provider
            try:
                llm_client = LLMClientFactory.create(self.config.llm)
            except Exception as e:
                logger.warning(f'Failed to create LLM client: {e}')

            # Create embedder client based on configured provider
            try:
                embedder_client = EmbedderFactory.create(self.config.embedder)
            except Exception as e:
                logger.warning(f'Failed to create embedder client: {e}')

            # Get database configuration
            db_config = DatabaseDriverFactory.create_config(self.config.database)

            # Build entity types from configuration
            custom_types = None
            if self.config.graphiti.entity_types:
                custom_types = {}
                for entity_type in self.config.graphiti.entity_types:
                    # Create a dynamic Pydantic model for each entity type
                    # Note: Don't use 'name' as it's a protected Pydantic attribute
                    entity_model = type(
                        entity_type.name,
                        (BaseModel,),
                        {
                            '__doc__': entity_type.description,
                        },
                    )
                    custom_types[entity_type.name] = entity_model

            # Store entity types for later use
            self.entity_types = custom_types

            # Initialize Graphiti client with appropriate driver
            try:
                if self.config.database.provider.lower() == 'falkordb':
                    # For FalkorDB, create a FalkorDriver instance directly
                    from graphiti_core.driver.falkordb_driver import FalkorDriver

                    falkor_driver = FalkorDriver(
                        host=db_config['host'],
                        port=db_config['port'],
                        password=db_config['password'],
                        database=db_config['database'],
                    )

                    self.client = Graphiti(
                        graph_driver=falkor_driver,
                        llm_client=llm_client,
                        embedder=embedder_client,
                        max_coroutines=self.semaphore_limit,
                    )
                else:
                    # For Neo4j (default), use the original approach
                    self.client = Graphiti(
                        uri=db_config['uri'],
                        user=db_config['user'],
                        password=db_config['password'],
                        llm_client=llm_client,
                        embedder=embedder_client,
                        max_coroutines=self.semaphore_limit,
                    )
            except Exception as db_error:
                # Check for connection errors
                error_msg = str(db_error).lower()
                if 'connection refused' in error_msg or 'could not connect' in error_msg:
                    db_provider = self.config.database.provider
                    if db_provider.lower() == 'falkordb':
                        raise RuntimeError(
                            f'\n{"=" * 70}\n'
                            f'Database Connection Error: FalkorDB is not running\n'
                            f'{"=" * 70}\n\n'
                            f'FalkorDB at {db_config["host"]}:{db_config["port"]} is not accessible.\n\n'
                            f'To start FalkorDB:\n'
                            f'  - Using Docker Compose: cd mcp_server && docker compose up\n'
                            f'  - Or run FalkorDB manually: docker run -p 6379:6379 falkordb/falkordb\n\n'
                            f'{"=" * 70}\n'
                        ) from db_error
                    elif db_provider.lower() == 'neo4j':
                        raise RuntimeError(
                            f'\n{"=" * 70}\n'
                            f'Database Connection Error: Neo4j is not running\n'
                            f'{"=" * 70}\n\n'
                            f'Neo4j at {db_config.get("uri", "unknown")} is not accessible.\n\n'
                            f'To start Neo4j:\n'
                            f'  - Using Docker Compose: cd mcp_server && docker compose -f docker/docker-compose-neo4j.yml up\n'
                            f'  - Or install Neo4j Desktop from: https://neo4j.com/download/\n'
                            f'  - Or run Neo4j manually: docker run -p 7474:7474 -p 7687:7687 neo4j:latest\n\n'
                            f'{"=" * 70}\n'
                        ) from db_error
                    else:
                        raise RuntimeError(
                            f'\n{"=" * 70}\n'
                            f'Database Connection Error: {db_provider} is not running\n'
                            f'{"=" * 70}\n\n'
                            f'{db_provider} at {db_config.get("uri", "unknown")} is not accessible.\n\n'
                            f'Please ensure {db_provider} is running and accessible.\n\n'
                            f'{"=" * 70}\n'
                        ) from db_error
                # Re-raise other errors
                raise

            # Build indices
            await self.client.build_indices_and_constraints()

            logger.info('Successfully initialized Graphiti client')

            # Log configuration details
            if llm_client:
                logger.info(
                    f'Using LLM provider: {self.config.llm.provider} / {self.config.llm.model}'
                )
            else:
                logger.info('No LLM client configured - entity extraction will be limited')

            if embedder_client:
                logger.info(f'Using Embedder provider: {self.config.embedder.provider}')
            else:
                logger.info('No Embedder client configured - search will be limited')

            if self.entity_types:
                entity_type_names = list(self.entity_types.keys())
                logger.info(f'Using custom entity types: {", ".join(entity_type_names)}')
            else:
                logger.info('Using default entity types')

            logger.info(f'Using database: {self.config.database.provider}')
            logger.info(f'Using group_id: {self.config.graphiti.group_id}')

        except Exception as e:
            logger.error(f'Failed to initialize Graphiti client: {e}')
            raise

    async def get_client(self) -> Graphiti:
        """Get the Graphiti client, initializing if necessary."""
        if self.client is None:
            await self.initialize()
        if self.client is None:
            raise RuntimeError('Failed to initialize Graphiti client')
        return self.client


@mcp.tool()
async def add_memory(
    name: str,
    episode_body: str,
    group_id: str | None = None,
    source: str = 'text',
    source_description: str = '',
    uuid: str | None = None,
) -> SuccessResponse | ErrorResponse:
    """Add an episode to memory. This is the primary way to add information to the graph.

    This function returns immediately and processes the episode addition in the background.
    Episodes for the same group_id are processed sequentially to avoid race conditions.

    Args:
        name (str): Name of the episode
        episode_body (str): The content of the episode to persist to memory. When source='json', this must be a
                           properly escaped JSON string, not a raw Python dictionary. The JSON data will be
                           automatically processed to extract entities and relationships.
        group_id (str, optional): A unique ID for this graph. If not provided, uses the default group_id from CLI
                                 or a generated one.
        source (str, optional): Source type, must be one of:
                               - 'text': For plain text content (default)
                               - 'json': For structured data
                               - 'message': For conversation-style content
        source_description (str, optional): Description of the source
        uuid (str, optional): Optional UUID for the episode

    Examples:
        # Adding plain text content
        add_memory(
            name="Company News",
            episode_body="Acme Corp announced a new product line today.",
            source="text",
            source_description="news article",
            group_id="some_arbitrary_string"
        )

        # Adding structured JSON data
        # NOTE: episode_body should be a JSON string (standard JSON escaping)
        add_memory(
            name="Customer Profile",
            episode_body='{"company": {"name": "Acme Technologies"}, "products": [{"id": "P001", "name": "CloudSync"}, {"id": "P002", "name": "DataMiner"}]}',
            source="json",
            source_description="CRM data"
        )
    """
    global graphiti_service, queue_service

    if graphiti_service is None or queue_service is None:
        return ErrorResponse(error='Services not initialized')

    try:
        # Use the provided group_id or fall back to the default from config
        effective_group_id = group_id or config.graphiti.group_id

        # Try to parse the source as an EpisodeType enum, with fallback to text
        episode_type = EpisodeType.text  # Default
        if source:
            try:
                episode_type = EpisodeType[source.lower()]
            except (KeyError, AttributeError):
                # If the source doesn't match any enum value, use text as default
                logger.warning(f"Unknown source type '{source}', using 'text' as default")
                episode_type = EpisodeType.text

        # Submit to queue service for async processing
        await queue_service.add_episode(
            group_id=effective_group_id,
            name=name,
            content=episode_body,
            source_description=source_description,
            episode_type=episode_type,
            entity_types=graphiti_service.entity_types,
            uuid=uuid or None,  # Ensure None is passed if uuid is None
        )

        return SuccessResponse(
            message=f"Episode '{name}' queued for processing in group '{effective_group_id}'"
        )
    except Exception as e:
        error_msg = str(e)
        logger.error(f'Error queuing episode: {error_msg}')
        return ErrorResponse(error=f'Error queuing episode: {error_msg}')


@mcp.tool()
async def search_nodes(
    query: str,
    group_ids: list[str] | None = None,
    max_nodes: int = 10,
    entity_types: list[str] | None = None,
) -> NodeSearchResponse | ErrorResponse:
    """Search for nodes in the graph memory.

    Args:
        query: The search query
        group_ids: Optional list of group IDs to filter results
        max_nodes: Maximum number of nodes to return (default: 10)
        entity_types: Optional list of entity type names to filter by
    """
    global graphiti_service

    if graphiti_service is None:
        return ErrorResponse(error='Graphiti service not initialized')

    try:
        client = await graphiti_service.get_client()

        # Use the provided group_ids or fall back to the default from config if none provided
        effective_group_ids = (
            group_ids
            if group_ids is not None
            else [config.graphiti.group_id]
            if config.graphiti.group_id
            else []
        )

        # Create search filters
        search_filters = SearchFilters(
            node_labels=entity_types,
        )

        # Use the search_ method with node search config
        from graphiti_core.search.search_config_recipes import NODE_HYBRID_SEARCH_RRF

        results = await client.search_(
            query=query,
            config=NODE_HYBRID_SEARCH_RRF,
            group_ids=effective_group_ids,
            search_filter=search_filters,
        )

        # Extract nodes from results
        nodes = results.nodes[:max_nodes] if results.nodes else []

        if not nodes:
            return NodeSearchResponse(message='No relevant nodes found', nodes=[], total_count=0)

        # Format the results
        node_results = []
        for node in nodes:
            # Get attributes and ensure no embeddings are included
            attrs = node.attributes if hasattr(node, 'attributes') else {}
            # Remove any embedding keys that might be in attributes
            attrs = {k: v for k, v in attrs.items() if 'embedding' not in k.lower()}

            node_results.append(
                NodeResult(
                    uuid=node.uuid,
                    name=node.name,
                    labels=node.labels if node.labels else [],
                    created_at=node.created_at.isoformat() if node.created_at else None,
                    summary=node.summary,
                    group_id=node.group_id,
                    attributes=attrs,
                )
            )

        return NodeSearchResponse(message='Nodes retrieved successfully', nodes=node_results, total_count=len(node_results))
    except Exception as e:
        error_msg = str(e)
        logger.error(f'Error searching nodes: {error_msg}')
        return ErrorResponse(error=f'Error searching nodes: {error_msg}')


@mcp.tool()
async def search_memory_facts(
    query: str,
    group_ids: list[str] | None = None,
    max_facts: int = 10,
    center_node_uuid: str | None = None,
    entity_types: list[str] | None = None,
    created_after: str | None = None,
    created_before: str | None = None,
) -> FactSearchResponse | ErrorResponse:
    """Search the graph memory for relevant facts.

    Returns retrieved count, total found, and whether more results likely exist.
    Use has_more to decide if you should search again with higher max_facts.

    Args:
        query: The search query
        group_ids: Optional list of group IDs to filter results
        max_facts: Maximum number of facts to return (default: 10)
        center_node_uuid: Optional UUID of a node to center the search around
        entity_types: Optional list of entity types to filter by (e.g., ["Preference", "Decision", "Gotcha"])
        created_after: Optional ISO datetime - only return facts created after this time
        created_before: Optional ISO datetime - only return facts created before this time

    Returns:
        FactSearchResponse with:
        - facts: The actual fact results (up to max_facts)
        - retrieved: Number of facts returned (len(facts))
        - total_found: Total facts found in expanded search
        - has_more: True if total_found >= search_limit (more likely exist)
    """
    global graphiti_service

    if graphiti_service is None:
        return ErrorResponse(error='Graphiti service not initialized')

    try:
        # Validate max_facts parameter
        if max_facts <= 0:
            return ErrorResponse(error='max_facts must be a positive integer')

        client = await graphiti_service.get_client()

        # Use the provided group_ids or fall back to the default from config if none provided
        effective_group_ids = (
            group_ids
            if group_ids is not None
            else [config.graphiti.group_id]
            if config.graphiti.group_id
            else []
        )

        # Request 3x max_facts to get a better sense of total available results
        # If we hit this limit, there are likely more results
        search_limit = max(max_facts * 3, 30)

        # Build search filters for entity types and temporal queries
        search_filters = SearchFilters()

        if entity_types:
            search_filters.node_labels = entity_types

        if created_after or created_before:
            from datetime import datetime
            date_filters = []

            if created_after:
                date_filters.append(DateFilter(
                    date=datetime.fromisoformat(created_after.replace('Z', '+00:00')),
                    comparison_operator=ComparisonOperator.greater_than_equal
                ))

            if created_before:
                date_filters.append(DateFilter(
                    date=datetime.fromisoformat(created_before.replace('Z', '+00:00')),
                    comparison_operator=ComparisonOperator.less_than_equal
                ))

            search_filters.created_at = [date_filters]  # AND these conditions

        # Check if we have any filters that require using search_() instead of search()
        has_filters = entity_types or created_after or created_before

        if has_filters:
            # Use advanced search with filters
            search_config = EDGE_HYBRID_SEARCH_RRF.model_copy(deep=True)
            search_config.limit = search_limit

            results = await client.search_(
                query=query,
                config=search_config,
                group_ids=effective_group_ids,
                search_filter=search_filters,
                center_node_uuid=center_node_uuid,
            )
            relevant_edges = results.edges if results.edges else []
        else:
            # Use simple search for backward compatibility
            relevant_edges = await client.search(
                group_ids=effective_group_ids,
                query=query,
                num_results=search_limit,
                center_node_uuid=center_node_uuid,
            )

        if not relevant_edges:
            return FactSearchResponse(
                message='No relevant facts found',
                facts=[],
                retrieved=0,
                total_found=0,
                has_more=False
            )

        # Track total found before limiting
        total_found = len(relevant_edges)

        # Determine if there are likely more results
        has_more = total_found >= search_limit

        # Only return max_facts results
        relevant_edges = relevant_edges[:max_facts]
        retrieved = len(relevant_edges)

        facts = [format_fact_result(edge) for edge in relevant_edges]

        # Build informative message
        filter_info = []
        if entity_types:
            filter_info.append(f'types={entity_types}')
        if created_after:
            filter_info.append(f'after={created_after}')
        if created_before:
            filter_info.append(f'before={created_before}')

        if has_more:
            message = f'Retrieved {retrieved} of {total_found}+ facts (more available)'
        else:
            message = f'Retrieved {retrieved} of {total_found} facts'

        if filter_info:
            message += f' [filters: {", ".join(filter_info)}]'

        return FactSearchResponse(
            message=message,
            facts=facts,
            retrieved=retrieved,
            total_found=total_found,
            has_more=has_more
        )
    except Exception as e:
        error_msg = str(e)
        logger.error(f'Error searching facts: {error_msg}')
        return ErrorResponse(error=f'Error searching facts: {error_msg}')


@mcp.tool()
async def delete_entity_edge(uuid: str) -> SuccessResponse | ErrorResponse:
    """Delete an entity edge from the graph memory.

    Args:
        uuid: UUID of the entity edge to delete
    """
    global graphiti_service

    if graphiti_service is None:
        return ErrorResponse(error='Graphiti service not initialized')

    try:
        client = await graphiti_service.get_client()

        # Get the entity edge by UUID
        entity_edge = await EntityEdge.get_by_uuid(client.driver, uuid)
        # Delete the edge using its delete method
        await entity_edge.delete(client.driver)
        return SuccessResponse(message=f'Entity edge with UUID {uuid} deleted successfully')
    except Exception as e:
        error_msg = str(e)
        logger.error(f'Error deleting entity edge: {error_msg}')
        return ErrorResponse(error=f'Error deleting entity edge: {error_msg}')


@mcp.tool()
async def delete_episode(uuid: str) -> SuccessResponse | ErrorResponse:
    """Delete an episode from the graph memory.

    Args:
        uuid: UUID of the episode to delete
    """
    global graphiti_service

    if graphiti_service is None:
        return ErrorResponse(error='Graphiti service not initialized')

    try:
        client = await graphiti_service.get_client()

        # Get the episodic node by UUID
        episodic_node = await EpisodicNode.get_by_uuid(client.driver, uuid)
        # Delete the node using its delete method
        await episodic_node.delete(client.driver)
        return SuccessResponse(message=f'Episode with UUID {uuid} deleted successfully')
    except Exception as e:
        error_msg = str(e)
        logger.error(f'Error deleting episode: {error_msg}')
        return ErrorResponse(error=f'Error deleting episode: {error_msg}')


@mcp.tool()
async def get_entity_edge(uuid: str) -> dict[str, Any] | ErrorResponse:
    """Get an entity edge from the graph memory by its UUID.

    Args:
        uuid: UUID of the entity edge to retrieve
    """
    global graphiti_service

    if graphiti_service is None:
        return ErrorResponse(error='Graphiti service not initialized')

    try:
        client = await graphiti_service.get_client()

        # Get the entity edge directly using the EntityEdge class method
        entity_edge = await EntityEdge.get_by_uuid(client.driver, uuid)

        # Use the format_fact_result function to serialize the edge
        # Return the Python dict directly - MCP will handle serialization
        return format_fact_result(entity_edge)
    except Exception as e:
        error_msg = str(e)
        logger.error(f'Error getting entity edge: {error_msg}')
        return ErrorResponse(error=f'Error getting entity edge: {error_msg}')


@mcp.tool()
async def get_episodes(
    group_ids: list[str] | None = None,
    max_episodes: int = 10,
) -> EpisodeSearchResponse | ErrorResponse:
    """Get episodes from the graph memory.

    Args:
        group_ids: Optional list of group IDs to filter results
        max_episodes: Maximum number of episodes to return (default: 10)
    """
    global graphiti_service

    if graphiti_service is None:
        return ErrorResponse(error='Graphiti service not initialized')

    try:
        client = await graphiti_service.get_client()

        # Use the provided group_ids or fall back to the default from config if none provided
        effective_group_ids = (
            group_ids
            if group_ids is not None
            else [config.graphiti.group_id]
            if config.graphiti.group_id
            else []
        )

        # Get episodes from the driver directly
        from graphiti_core.nodes import EpisodicNode

        if effective_group_ids:
            episodes = await EpisodicNode.get_by_group_ids(
                client.driver, effective_group_ids, limit=max_episodes
            )
        else:
            # If no group IDs, we need to use a different approach
            # For now, return empty list when no group IDs specified
            episodes = []

        if not episodes:
            return EpisodeSearchResponse(message='No episodes found', episodes=[], total_count=0)

        # Format the results
        episode_results = []
        for episode in episodes:
            episode_dict = {
                'uuid': episode.uuid,
                'name': episode.name,
                'content': episode.content,
                'created_at': episode.created_at.isoformat() if episode.created_at else None,
                'source': episode.source.value
                if hasattr(episode.source, 'value')
                else str(episode.source),
                'source_description': episode.source_description,
                'group_id': episode.group_id,
            }
            episode_results.append(episode_dict)

        return EpisodeSearchResponse(
            message='Episodes retrieved successfully', episodes=episode_results, total_count=len(episode_results)
        )
    except Exception as e:
        error_msg = str(e)
        logger.error(f'Error getting episodes: {error_msg}')
        return ErrorResponse(error=f'Error getting episodes: {error_msg}')


@mcp.tool()
async def clear_graph(group_ids: list[str] | None = None) -> SuccessResponse | ErrorResponse:
    """Clear all data from the graph for specified group IDs.

    Args:
        group_ids: Optional list of group IDs to clear. If not provided, clears the default group.
    """
    global graphiti_service

    if graphiti_service is None:
        return ErrorResponse(error='Graphiti service not initialized')

    try:
        client = await graphiti_service.get_client()

        # Use the provided group_ids or fall back to the default from config if none provided
        effective_group_ids = (
            group_ids or [config.graphiti.group_id] if config.graphiti.group_id else []
        )

        if not effective_group_ids:
            return ErrorResponse(error='No group IDs specified for clearing')

        # Clear data for the specified group IDs
        await clear_data(client.driver, group_ids=effective_group_ids)

        return SuccessResponse(
            message=f'Graph data cleared successfully for group IDs: {", ".join(effective_group_ids)}'
        )
    except Exception as e:
        error_msg = str(e)
        logger.error(f'Error clearing graph: {error_msg}')
        return ErrorResponse(error=f'Error clearing graph: {error_msg}')


@mcp.tool()
async def get_status() -> StatusResponse:
    """Get the status of the Graphiti MCP server and database connection."""
    global graphiti_service

    if graphiti_service is None:
        return StatusResponse(status='error', message='Graphiti service not initialized')

    try:
        client = await graphiti_service.get_client()

        # Test database connection with a simple query
        async with client.driver.session() as session:
            result = await session.run('MATCH (n) RETURN count(n) as count')
            # Consume the result to verify query execution
            if result:
                _ = [record async for record in result]

        # Use the provider from the service's config, not the global
        provider_name = graphiti_service.config.database.provider
        return StatusResponse(
            status='ok',
            message=f'Graphiti MCP server is running and connected to {provider_name} database',
        )
    except Exception as e:
        error_msg = str(e)
        logger.error(f'Error checking database connection: {error_msg}')
        return StatusResponse(
            status='error',
            message=f'Graphiti MCP server is running but database connection failed: {error_msg}',
        )


# === Emily Fork: Advanced Search Tools ===


@mcp.tool()
async def search_with_recipe(
    query: str,
    recipe: str = "EDGE_HYBRID_SEARCH_RRF",
    group_ids: list[str] | None = None,
    max_results: int = 10,
    center_node_uuid: str | None = None,
) -> FactSearchResponse | ErrorResponse:
    """Search using advanced search configuration recipes.

    Different recipes optimize for different use cases. The default RRF
    (Reciprocal Rank Fusion) provides a good balance of quality and speed.

    Available recipes:
    - EDGE_HYBRID_SEARCH_RRF (default) - Hybrid edge search with RRF reranking
    - EDGE_HYBRID_SEARCH_NODE_DISTANCE - Rerank by distance from center_node (requires center_node_uuid)
    - NODE_HYBRID_SEARCH_RRF - Search entity nodes instead of edges/facts
    - COMBINED_HYBRID_SEARCH_RRF - Search nodes, edges, and communities together

    Args:
        query: The search query
        recipe: Search recipe name (see list above)
        group_ids: Optional list of group IDs to filter results
        max_results: Maximum results to return (default: 10)
        center_node_uuid: Required for NODE_DISTANCE recipe - UUID of focal entity
    """
    global graphiti_service

    if graphiti_service is None:
        return ErrorResponse(error='Graphiti service not initialized')

    try:
        client = await graphiti_service.get_client()

        # Use the provided group_ids or fall back to the default from config
        effective_group_ids = (
            group_ids
            if group_ids is not None
            else [config.graphiti.group_id]
            if config.graphiti.group_id
            else []
        )

        # Map recipe names to configs
        recipe_map = {
            "EDGE_HYBRID_SEARCH_RRF": EDGE_HYBRID_SEARCH_RRF,
            "EDGE_HYBRID_SEARCH_NODE_DISTANCE": EDGE_HYBRID_SEARCH_NODE_DISTANCE,
            "NODE_HYBRID_SEARCH_RRF": NODE_HYBRID_SEARCH_RRF,
            "COMBINED_HYBRID_SEARCH_RRF": COMBINED_HYBRID_SEARCH_RRF,
        }

        if recipe not in recipe_map:
            return ErrorResponse(
                error=f'Unknown recipe: {recipe}. Available: {list(recipe_map.keys())}'
            )

        # Copy and configure the search config
        search_config = recipe_map[recipe].model_copy(deep=True)
        search_config.limit = max_results

        results = await client.search_(
            query=query,
            config=search_config,
            group_ids=effective_group_ids,
            center_node_uuid=center_node_uuid,
        )

        # Handle different result types based on recipe
        if recipe == "NODE_HYBRID_SEARCH_RRF":
            # Node search returns nodes, not edges
            nodes = results.nodes[:max_results] if results.nodes else []
            if not nodes:
                return FactSearchResponse(
                    message='No relevant nodes found',
                    facts=[],
                    retrieved=0,
                    total_found=0,
                    has_more=False
                )
            # Convert nodes to fact-like format for consistency
            facts = []
            for node in nodes:
                facts.append({
                    'uuid': node.uuid,
                    'name': node.name,
                    'fact': node.summary or f'Entity: {node.name}',
                    'labels': node.labels if node.labels else [],
                    'created_at': node.created_at.isoformat() if node.created_at else None,
                    'group_id': node.group_id,
                })
            return FactSearchResponse(
                message=f'Found {len(facts)} nodes using {recipe}',
                facts=facts,
                retrieved=len(facts),
                total_found=len(facts),
                has_more=False
            )
        else:
            # Edge search returns edges/facts
            edges = results.edges[:max_results] if results.edges else []
            if not edges:
                return FactSearchResponse(
                    message='No relevant facts found',
                    facts=[],
                    retrieved=0,
                    total_found=0,
                    has_more=False
                )

            facts = [format_fact_result(edge) for edge in edges]
            return FactSearchResponse(
                message=f'Found {len(facts)} facts using {recipe}',
                facts=facts,
                retrieved=len(facts),
                total_found=len(facts),
                has_more=False
            )

    except Exception as e:
        error_msg = str(e)
        logger.error(f'Error in recipe search: {error_msg}')
        return ErrorResponse(error=f'Error in recipe search: {error_msg}')


@mcp.tool()
async def search_from_entity(
    query: str,
    entity_name: str,
    group_ids: list[str] | None = None,
    max_results: int = 10,
) -> FactSearchResponse | ErrorResponse:
    """Search facts relevant to a specific entity (focal search).

    First finds the entity by name, then searches using that as the focal point.
    Results are reranked by graph distance from the entity, providing more
    relevant results for questions about a specific person, project, or concept.

    Example: search_from_entity("preferences", "Colter") finds Colter's preferences.

    Args:
        query: The search query (what to find)
        entity_name: Name of entity to search from (e.g., "Colter", "Emily", "Discord Bot")
        group_ids: Optional list of group IDs to filter results
        max_results: Maximum results to return (default: 10)
    """
    global graphiti_service

    if graphiti_service is None:
        return ErrorResponse(error='Graphiti service not initialized')

    try:
        client = await graphiti_service.get_client()

        # Use the provided group_ids or fall back to the default from config
        effective_group_ids = (
            group_ids
            if group_ids is not None
            else [config.graphiti.group_id]
            if config.graphiti.group_id
            else []
        )

        # First find the entity node
        node_config = NODE_HYBRID_SEARCH_RRF.model_copy(deep=True)
        node_config.limit = 5  # Just need to find the entity

        node_results = await client.search_(
            query=entity_name,
            config=node_config,
            group_ids=effective_group_ids,
        )

        if not node_results.nodes:
            return ErrorResponse(error=f'Entity "{entity_name}" not found in the knowledge graph')

        center_uuid = node_results.nodes[0].uuid
        found_entity = node_results.nodes[0].name

        # Now search with that as the center using node distance reranking
        search_config = EDGE_HYBRID_SEARCH_NODE_DISTANCE.model_copy(deep=True)
        search_config.limit = max_results

        results = await client.search_(
            query=query,
            config=search_config,
            group_ids=effective_group_ids,
            center_node_uuid=center_uuid,
        )

        edges = results.edges[:max_results] if results.edges else []

        if not edges:
            return FactSearchResponse(
                message=f'No facts found near "{found_entity}"',
                facts=[],
                retrieved=0,
                total_found=0,
                has_more=False
            )

        facts = [format_fact_result(edge) for edge in edges]

        return FactSearchResponse(
            message=f'Found {len(facts)} facts centered on "{found_entity}"',
            facts=facts,
            retrieved=len(facts),
            total_found=len(facts),
            has_more=False
        )

    except Exception as e:
        error_msg = str(e)
        logger.error(f'Error in focal entity search: {error_msg}')
        return ErrorResponse(error=f'Error in focal entity search: {error_msg}')


@mcp.tool()
async def search_facts_by_time(
    created_after: str | None = None,
    created_before: str | None = None,
    valid_after: str | None = None,
    valid_before: str | None = None,
    include_invalidated: bool = False,
    group_ids: list[str] | None = None,
    max_facts: int = 20,
) -> TemporalFactSearchResponse | ErrorResponse:
    """Search facts by temporal criteria.

    Useful for questions like:
    - "What did I learn last week?" (created_after=7 days ago)
    - "What facts are no longer valid?" (include_invalidated=True)
    - "Show me everything from December" (created_after/before)

    At least one temporal filter is required. All datetime values should be
    ISO 8601 format (e.g., "2025-12-01T00:00:00Z").

    Args:
        created_after: ISO datetime - facts created after this time
        created_before: ISO datetime - facts created before this time
        valid_after: ISO datetime - facts that became valid after this time
        valid_before: ISO datetime - facts that became valid before this time
        include_invalidated: If True, include facts that have been invalidated/superseded
        group_ids: Optional list of group IDs to filter results
        max_facts: Maximum number of facts to return (default: 20)
    """
    global graphiti_service

    if graphiti_service is None:
        return ErrorResponse(error='Graphiti service not initialized')

    if not any([created_after, created_before, valid_after, valid_before]):
        return ErrorResponse(error='At least one temporal filter is required')

    try:
        from datetime import datetime

        client = await graphiti_service.get_client()

        effective_group_ids = (
            group_ids
            if group_ids is not None
            else [config.graphiti.group_id]
            if config.graphiti.group_id
            else []
        )

        search_filters = SearchFilters()

        # Build created_at filters
        if created_after or created_before:
            created_filters = []
            if created_after:
                created_filters.append(DateFilter(
                    date=datetime.fromisoformat(created_after.replace('Z', '+00:00')),
                    comparison_operator=ComparisonOperator.greater_than_equal
                ))
            if created_before:
                created_filters.append(DateFilter(
                    date=datetime.fromisoformat(created_before.replace('Z', '+00:00')),
                    comparison_operator=ComparisonOperator.less_than_equal
                ))
            search_filters.created_at = [created_filters]

        # Build valid_at filters
        if valid_after or valid_before:
            valid_filters = []
            if valid_after:
                valid_filters.append(DateFilter(
                    date=datetime.fromisoformat(valid_after.replace('Z', '+00:00')),
                    comparison_operator=ComparisonOperator.greater_than_equal
                ))
            if valid_before:
                valid_filters.append(DateFilter(
                    date=datetime.fromisoformat(valid_before.replace('Z', '+00:00')),
                    comparison_operator=ComparisonOperator.less_than_equal
                ))
            search_filters.valid_at = [valid_filters]

        # Exclude invalidated facts unless requested
        if not include_invalidated:
            search_filters.invalid_at = [[DateFilter(
                date=None,
                comparison_operator=ComparisonOperator.is_null
            )]]

        # Use a broad query since we're primarily filtering by time
        # Note: RediSearch FTS doesn't support "*" wildcard, and stopwords get filtered
        # Use meaningful terms that commonly appear in facts
        search_config = EDGE_HYBRID_SEARCH_RRF.model_copy(deep=True)
        search_config.limit = max_facts

        results = await client.search_(
            query="preference memory knowledge context recent",  # Non-stopword terms
            config=search_config,
            group_ids=effective_group_ids,
            search_filter=search_filters,
        )

        edges = results.edges[:max_facts] if results.edges else []
        facts = [format_fact_result(edge) for edge in edges]

        date_range = {
            "created_after": created_after,
            "created_before": created_before,
            "valid_after": valid_after,
            "valid_before": valid_before,
        }

        return TemporalFactSearchResponse(
            message=f'Found {len(facts)} facts in specified time range',
            facts=facts,
            retrieved=len(facts),
            date_range=date_range
        )

    except Exception as e:
        error_msg = str(e)
        logger.error(f'Error in temporal search: {error_msg}')
        return ErrorResponse(error=f'Error in temporal search: {error_msg}')


@mcp.tool()
async def get_episode_content(
    episode_uuids: list[str],
) -> EpisodeContentResponse | ErrorResponse:
    """Get all nodes and facts extracted from specific episodes.

    Useful for understanding what was learned from a particular conversation
    or reviewing the entities/relationships extracted from a memory.

    Args:
        episode_uuids: List of episode UUIDs to get content for
    """
    global graphiti_service

    if graphiti_service is None:
        return ErrorResponse(error='Graphiti service not initialized')

    if not episode_uuids:
        return ErrorResponse(error='At least one episode UUID is required')

    try:
        client = await graphiti_service.get_client()

        results = await client.get_nodes_and_edges_by_episode(episode_uuids)

        # Format nodes
        node_results = []
        for node in results.nodes:
            attrs = node.attributes if hasattr(node, 'attributes') else {}
            attrs = {k: v for k, v in attrs.items() if 'embedding' not in k.lower()}

            node_results.append(NodeResult(
                uuid=node.uuid,
                name=node.name,
                labels=node.labels if node.labels else [],
                created_at=node.created_at.isoformat() if node.created_at else None,
                summary=node.summary,
                group_id=node.group_id,
                attributes=attrs,
            ))

        # Format facts
        facts = [format_fact_result(edge) for edge in results.edges]

        return EpisodeContentResponse(
            message=f'Found {len(node_results)} nodes and {len(facts)} facts from {len(episode_uuids)} episodes',
            episode_uuids=episode_uuids,
            nodes=node_results,
            facts=facts,
            node_count=len(node_results),
            fact_count=len(facts)
        )

    except Exception as e:
        error_msg = str(e)
        logger.error(f'Error getting episode content: {error_msg}')
        return ErrorResponse(error=f'Error getting episode content: {error_msg}')


@mcp.tool()
async def build_communities(
    group_ids: list[str] | None = None,
) -> CommunityBuildResponse | ErrorResponse:
    """Build community clusters from related entities in the knowledge graph.

    Communities group related entities together with LLM-generated summaries.
    This is useful for understanding knowledge clusters and high-level topics.

    WARNING: This rebuilds ALL communities for the specified groups,
    deleting existing community nodes first. This is a heavyweight operation
    that makes multiple LLM calls.

    Args:
        group_ids: Optional list of group IDs to build communities for.
                   If None, builds communities for the default group.
    """
    global graphiti_service

    if graphiti_service is None:
        return ErrorResponse(error='Graphiti service not initialized')

    try:
        client = await graphiti_service.get_client()

        effective_group_ids = (
            group_ids
            if group_ids is not None
            else [config.graphiti.group_id]
            if config.graphiti.group_id
            else None
        )

        logger.info(f'Building communities for groups: {effective_group_ids}')

        community_nodes, community_edges = await client.build_communities(
            group_ids=effective_group_ids
        )

        communities = []
        for node in community_nodes:
            # Count members by counting edges from this community
            member_count = sum(1 for e in community_edges if e.source_node_uuid == node.uuid)
            communities.append(CommunityResult(
                uuid=node.uuid,
                name=node.name,
                summary=node.summary or '',
                group_id=node.group_id,
                member_count=member_count
            ))

        logger.info(f'Built {len(communities)} communities with {len(community_edges)} membership edges')

        return CommunityBuildResponse(
            message=f'Built {len(communities)} communities with {len(community_edges)} membership edges',
            communities=communities,
            total_communities=len(communities),
            total_edges=len(community_edges)
        )

    except Exception as e:
        error_msg = str(e)
        logger.error(f'Error building communities: {error_msg}')
        return ErrorResponse(error=f'Error building communities: {error_msg}')


@mcp.custom_route('/health', methods=['GET'])
async def health_check(request) -> JSONResponse:
    """Health check endpoint for Docker and load balancers."""
    return JSONResponse({'status': 'healthy', 'service': 'graphiti-mcp'})


async def initialize_server() -> ServerConfig:
    """Parse CLI arguments and initialize the Graphiti server configuration."""
    global config, graphiti_service, queue_service, graphiti_client, semaphore

    parser = argparse.ArgumentParser(
        description='Run the Graphiti MCP server with YAML configuration support'
    )

    # Configuration file argument
    # Use CONFIG_PATH from environment if set (docker-compose override)
    # Otherwise default to config/config.yaml relative to the mcp_server directory
    env_config = os.environ.get('CONFIG_PATH')
    default_config = Path(env_config) if env_config else Path(__file__).parent.parent / 'config' / 'config.yaml'
    parser.add_argument(
        '--config',
        type=Path,
        default=default_config,
        help='Path to YAML configuration file (default: config/config.yaml)',
    )

    # Transport arguments
    parser.add_argument(
        '--transport',
        choices=['sse', 'stdio', 'http'],
        help='Transport to use: http (recommended, default), stdio (standard I/O), or sse (deprecated)',
    )
    parser.add_argument(
        '--host',
        help='Host to bind the MCP server to',
    )
    parser.add_argument(
        '--port',
        type=int,
        help='Port to bind the MCP server to',
    )

    # Provider selection arguments
    parser.add_argument(
        '--llm-provider',
        choices=['openai', 'azure_openai', 'anthropic', 'gemini', 'groq'],
        help='LLM provider to use',
    )
    parser.add_argument(
        '--embedder-provider',
        choices=['openai', 'azure_openai', 'gemini', 'voyage'],
        help='Embedder provider to use',
    )
    parser.add_argument(
        '--database-provider',
        choices=['neo4j', 'falkordb'],
        help='Database provider to use',
    )

    # LLM configuration arguments
    parser.add_argument('--model', help='Model name to use with the LLM client')
    parser.add_argument('--small-model', help='Small model name to use with the LLM client')
    parser.add_argument(
        '--temperature', type=float, help='Temperature setting for the LLM (0.0-2.0)'
    )

    # Embedder configuration arguments
    parser.add_argument('--embedder-model', help='Model name to use with the embedder')

    # Graphiti-specific arguments
    parser.add_argument(
        '--group-id',
        help='Namespace for the graph. If not provided, uses config file or generates random UUID.',
    )
    parser.add_argument(
        '--user-id',
        help='User ID for tracking operations',
    )
    parser.add_argument(
        '--destroy-graph',
        action='store_true',
        help='Destroy all Graphiti graphs on startup',
    )

    args = parser.parse_args()

    # Set config path in environment for the settings to pick up
    if args.config:
        os.environ['CONFIG_PATH'] = str(args.config)

    # Load configuration with environment variables and YAML
    config = GraphitiConfig()

    # Apply CLI overrides
    config.apply_cli_overrides(args)

    # Also apply legacy CLI args for backward compatibility
    if hasattr(args, 'destroy_graph'):
        config.destroy_graph = args.destroy_graph

    # Log configuration details
    logger.info('Using configuration:')
    logger.info(f'  - LLM: {config.llm.provider} / {config.llm.model}')
    logger.info(f'  - Embedder: {config.embedder.provider} / {config.embedder.model}')
    logger.info(f'  - Database: {config.database.provider}')
    logger.info(f'  - Group ID: {config.graphiti.group_id}')
    logger.info(f'  - Transport: {config.server.transport}')

    # Log graphiti-core version
    try:
        import graphiti_core

        graphiti_version = getattr(graphiti_core, '__version__', 'unknown')
        logger.info(f'  - Graphiti Core: {graphiti_version}')
    except Exception:
        # Check for Docker-stored version file
        version_file = Path('/app/.graphiti-core-version')
        if version_file.exists():
            graphiti_version = version_file.read_text().strip()
            logger.info(f'  - Graphiti Core: {graphiti_version}')
        else:
            logger.info('  - Graphiti Core: version unavailable')

    # Handle graph destruction if requested
    if hasattr(config, 'destroy_graph') and config.destroy_graph:
        logger.warning('Destroying all Graphiti graphs as requested...')
        temp_service = GraphitiService(config, SEMAPHORE_LIMIT)
        await temp_service.initialize()
        client = await temp_service.get_client()
        await clear_data(client.driver)
        logger.info('All graphs destroyed')

    # Initialize services
    graphiti_service = GraphitiService(config, SEMAPHORE_LIMIT)
    queue_service = QueueService()
    await graphiti_service.initialize()

    # Set global client for backward compatibility
    graphiti_client = await graphiti_service.get_client()
    semaphore = graphiti_service.semaphore

    # Initialize queue service with the client
    await queue_service.initialize(graphiti_client)

    # Set MCP server settings
    if config.server.host:
        mcp.settings.host = config.server.host
    if config.server.port:
        mcp.settings.port = config.server.port

    # Return MCP configuration for transport
    return config.server


async def run_mcp_server():
    """Run the MCP server in the current event loop."""
    # Initialize the server
    mcp_config = await initialize_server()

    # Run the server with configured transport
    logger.info(f'Starting MCP server with transport: {mcp_config.transport}')
    if mcp_config.transport == 'stdio':
        await mcp.run_stdio_async()
    elif mcp_config.transport == 'sse':
        logger.info(
            f'Running MCP server with SSE transport on {mcp.settings.host}:{mcp.settings.port}'
        )
        logger.info(f'Access the server at: http://{mcp.settings.host}:{mcp.settings.port}/sse')
        await mcp.run_sse_async()
    elif mcp_config.transport == 'http':
        # Use localhost for display if binding to 0.0.0.0
        display_host = 'localhost' if mcp.settings.host == '0.0.0.0' else mcp.settings.host
        logger.info(
            f'Running MCP server with streamable HTTP transport on {mcp.settings.host}:{mcp.settings.port}'
        )
        logger.info('=' * 60)
        logger.info('MCP Server Access Information:')
        logger.info(f'  Base URL: http://{display_host}:{mcp.settings.port}/')
        logger.info(f'  MCP Endpoint: http://{display_host}:{mcp.settings.port}/mcp/')
        logger.info('  Transport: HTTP (streamable)')

        # Show FalkorDB Browser UI access if enabled
        if os.environ.get('BROWSER', '1') == '1':
            logger.info(f'  FalkorDB Browser UI: http://{display_host}:3000/')

        logger.info('=' * 60)
        logger.info('For MCP clients, connect to the /mcp/ endpoint above')

        # Configure uvicorn logging to match our format
        configure_uvicorn_logging()

        await mcp.run_streamable_http_async()
    else:
        raise ValueError(
            f'Unsupported transport: {mcp_config.transport}. Use "sse", "stdio", or "http"'
        )


def main():
    """Main function to run the Graphiti MCP server."""
    try:
        # Run everything in a single event loop
        asyncio.run(run_mcp_server())
    except KeyboardInterrupt:
        logger.info('Server shutting down...')
    except Exception as e:
        logger.error(f'Error initializing Graphiti MCP server: {str(e)}')
        raise


if __name__ == '__main__':
    main()
