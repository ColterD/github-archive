# coco GitHub Remote

coco's private GitHub repository is:

```bash
https://github.com/ColterD/coco
```

Local remotes should be:

```bash
origin   https://github.com/ColterD/coco.git
upstream https://github.com/tailcallhq/forgecode.git
```

`origin` is the only GitHub remote that should receive coco changes.
`upstream` is read-only and must keep its push URL set to `DISABLED`.

## Authentication

If GitHub CLI auth needs to be refreshed:

```bash
gh auth login
```

Verify it with:

```bash
gh auth status
gh api user --jq '{login, name, id}'
```

## Deprecated Name

If the old `CoCo` repository already exists, do not overwrite it blindly. First
rename/archive the old repository:

```bash
owner="$(gh api user --jq .login)"
stamp="$(date +%Y%m%d)"

gh repo rename "CoCo-deprecated-${stamp}" \
  --repo "${owner}/CoCo"

gh repo archive "${owner}/CoCo-deprecated-${stamp}" \
  --yes
```
