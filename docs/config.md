---
title: lando config
description: lando config displays the lando configuration.
---

# lando config

Displays the lando configuration.

You can also use `--field` to only display a single config value. *Almost all* of these options can be overridden via the Lando global `config.yml`. See the [config system](https://docs.lando.dev/core/v3/global.html) for more info.

## Usage

```sh
# Show me a config worthy of lando
lando config

# Show me only the "mode"
lando config --path mode

# Show me in json
lando config --format json
```

## Options

```sh
--channel      Sets the update channel                                                  [array] [choices: "edge", "none", "stable"]
--clear        Clears the lando tasks cache                                                                               [boolean]
--debug        Shows debug output                                                                                         [boolean]
--help         Shows lando or delegated command help if applicable                                                        [boolean]
--verbose, -v  Runs with extra verbosity                                                                                    [count]
--format       Output in given format: default, json, table                          [string] [choices: "default", "json", "table"]
--path         Only return the value at the given path                                                     [string] [default: null]
```
