---
title: lando plugin-add
description: lando plugin-add installs the plugin(s) indicated in the primary argument.
---

# plugin-add

Installs plugins.

This will install the plugin(s) indicated in the primary argument and add them to Lando's plugin registry. Plugins will be installed in your `.lando/plugins` directory and updated when `lando update` is executed.

## Usage

```bash
lando plugin-add <plugin> [plugins...]
```

## Options

```bash
  --channel   Sets the update channel   [array] [choices: "edge", "none", "stable"]
  --help      Shows lando or delegated command help if applicable   [boolean]
  --auth, -a  Use global or scoped auth   [array] [default: []]
  --registry, -r, -s, --scope  Use global or scoped registry    [array] [default: []]
```
