# coco Upstream Policy

Tailcall's ForgeCode repository is read-only input for coco.

Allowed upstream actions:

1. Fetching commits, tags, and metadata from `tailcallhq/forgecode`.
2. Reading upstream code, issues, releases, and documentation.
3. Porting upstream changes into this fork.
4. Comparing upstream behavior with coco behavior.

Forbidden upstream actions:

1. Pushing branches or tags to `tailcallhq/forgecode`.
2. Opening pull requests against `tailcallhq/forgecode`.
3. Creating or editing issues, comments, reviews, discussions, releases, wiki
   pages, or any other upstream GitHub state.
4. Running automation that writes to upstream.

Local guardrails:

1. The `upstream` remote push URL is set to `DISABLED`.
2. `.githooks/pre-push` blocks pushes to `tailcallhq/forgecode` and to the
   `upstream` remote.
3. `scripts/coco-sync-upstream.sh` refuses to run if the `upstream` push URL is
   anything other than `DISABLED`.

If an upstream change conflicts with coco, resolve it in this fork only. Keep
coco's implementation, upstream's implementation, or a merged version based on
which result is better for our coding and agentic workflow.
