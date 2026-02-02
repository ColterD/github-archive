"""Response type definitions for Graphiti MCP Server."""

from typing import Any

from typing_extensions import TypedDict


class ErrorResponse(TypedDict):
    error: str


class SuccessResponse(TypedDict):
    message: str


class NodeResult(TypedDict):
    uuid: str
    name: str
    labels: list[str]
    created_at: str | None
    summary: str | None
    group_id: str
    attributes: dict[str, Any]


class NodeSearchResponse(TypedDict):
    message: str
    nodes: list[NodeResult]
    total_count: int | None


class FactSearchResponse(TypedDict):
    message: str
    facts: list[dict[str, Any]]
    retrieved: int  # Number of facts actually returned
    total_found: int  # Total facts found in search (may be capped by search limit)
    has_more: bool  # True if there are likely more results beyond what was searched


class EpisodeSearchResponse(TypedDict):
    message: str
    episodes: list[dict[str, Any]]
    total_count: int | None


class StatusResponse(TypedDict):
    status: str
    message: str


class InvalidatedFactResult(TypedDict):
    uuid: str
    fact: str
    name: str
    group_id: str
    created_at: str | None
    invalid_at: str | None
    expired_at: str | None


class InvalidatedFactsResponse(TypedDict):
    message: str
    facts: list[InvalidatedFactResult]
    total_count: int


class PruneResponse(TypedDict):
    message: str
    pruned_count: int
    failed_count: int


# === Emily Fork Additions ===


class TemporalFactSearchResponse(TypedDict):
    """Response for temporal fact searches."""
    message: str
    facts: list[dict[str, Any]]
    retrieved: int
    date_range: dict[str, str | None]  # {"created_after": "...", "created_before": "...", etc}


class EpisodeContentResponse(TypedDict):
    """Response for getting content extracted from episodes."""
    message: str
    episode_uuids: list[str]
    nodes: list[NodeResult]
    facts: list[dict[str, Any]]
    node_count: int
    fact_count: int


class CommunityResult(TypedDict):
    """A single community cluster."""
    uuid: str
    name: str
    summary: str
    group_id: str
    member_count: int


class CommunityBuildResponse(TypedDict):
    """Response for community building operation."""
    message: str
    communities: list[CommunityResult]
    total_communities: int
    total_edges: int
