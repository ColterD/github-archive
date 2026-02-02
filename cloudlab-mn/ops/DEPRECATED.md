# DEPRECATED: Legacy Docker Compose Files

The docker-compose files in this directory have been consolidated into Coolify-managed stacks.

## Migration

Old structure → New structure:

| Old Location | New Location |
|-------------|--------------|
| `cognitive-core/docker-compose.yaml` | `../stacks/utah-core/docker-compose.yaml` |
| `memory/docker-compose.yaml` | `../stacks/utah-core/docker-compose.yaml` |
| `sensory/docker-compose.yaml` | `../stacks/utah-embodiment/docker-compose.yaml` |
| `ui/docker-compose.yaml` | `../stacks/utah-core/docker-compose.yaml` |
| `minnesota/docker-compose.lfm.yaml` | `../stacks/minnesota-lfm/docker-compose.yaml` |
| `utah/docker-compose.lfm-fallback.yaml` | `../stacks/utah-embodiment/docker-compose.yaml` |

## New Deployment

See `/stacks/README.md` for Coolify deployment instructions.
