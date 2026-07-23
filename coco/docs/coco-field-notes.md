# coco Field Notes

Use upstream ForgeCode as the daily baseline. Record issues here only when they
come from real work.

## Baseline

- Installed upstream ForgeCode `2.11.3` to `/home/colter/.local/bin/forge`.
- `forge provider list` works.
- `forge doctor` reports one zsh-plugin failure, which is expected because this
  machine's normal shell is fish.
- `fgc upstream` runs official ForgeCode.
- `fgc coco` runs the locally built coco fork with `FORGE_CONFIG=/home/colter/.forge-coco`.
- `origin` is `https://github.com/ColterD/coco.git`.
- `upstream` is `https://github.com/tailcallhq/forgecode.git` with push disabled.

## Capture Template

```md
## YYYY-MM-DD - Short title

Context:

Observed upstream behavior:

Why it matters:

Possible coco change:

Decision:
```
