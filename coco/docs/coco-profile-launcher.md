# coco Profile Launcher

Use `fgc` to choose between upstream ForgeCode and the coco fork.

```bash
fgc
```

Direct profile aliases:

```bash
fgc upstream
fgc coco
```

Version checks:

```bash
fgc upstream --version
fgc coco --version
```

## Profiles

`upstream` runs the official installed ForgeCode binary:

```bash
/home/colter/.local/bin/forge
```

It uses the normal upstream ForgeCode environment, currently `~/.forge`.

`coco` runs the locally built fork binary:

```bash
/home/colter/Projects/coco/target/debug/forge
```

It uses an isolated config directory:

```bash
/home/colter/.forge-coco
```

The `forge-coco` wrapper rebuilds the fork binary when the source tree or HEAD
changes before launching it.

## Local Launchers

Installed local launchers:

```bash
/home/colter/.local/bin/fgc
/home/colter/.local/bin/forge-upstream
/home/colter/.local/bin/forge-coco
```

Do not use `fc` for this launcher. In Bash, `fc` is a shell builtin.
