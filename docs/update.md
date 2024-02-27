---
title: lando update
description: lando update updates all of Lando's components, including installed plugins.
---

# lando update

Updates Lando.

This will update all the constituent components of Lando, including `@lando/core`, `@lando/cli`, and any Lando plugins you may have installed (ex: `@lando/php`).

## Usage

```sh
lando update
```

## Options

```sh
--channel      Sets the update channel                                                  [array] [choices: "edge", "none", "stable"]
--clear        Clears the lando tasks cache                                                                               [boolean]
--debug        Shows debug output                                                                                         [boolean]
--help         Shows lando or delegated command help if applicable                                                        [boolean]
--verbose, -v  Runs with extra verbosity                                                                                    [count]
--yes, -y      Runs non-interactively with all accepted default answers                                  [boolean] [default: false]
```
