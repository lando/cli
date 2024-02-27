---
title: lando plugin-add
description: lando plugin-add installs the plugin(s) indicated in the primary argument.
---

# lando plugin-add

Installs plugins.

This will install the plugin(s) passed in as arguments and make them available for use in Lando.

Plugins will be installed in `~/.lando/plugins` by default unless you've modified your [global config](https://docs.lando.dev/core/v3/index.html) to install them elsewhere.

## Usage

```sh
lando plugin-add <plugin> [plugins...]
```

## Options

```sh
--channel                    Sets the update channel                                    [array] [choices: "edge", "none", "stable"]
--clear                      Clears the lando tasks cache                                                                 [boolean]
--debug                      Shows debug output                                                                           [boolean]
--help                       Shows lando or delegated command help if applicable                                          [boolean]
--verbose, -v                Runs with extra verbosity                                                                      [count]
--auth, -a                   Use global or scoped auth                                                        [array] [default: []]
--registry, -r, -s, --scope  Use global or scoped registry                                                    [array] [default: []]
```
