---
title: lando shellenv
description: lando shellenv prints information you can use to add lando PATH info to a shell rcfile.
---

# lando shellenv

Prints information you can add to a shell rcfile like `~/.zshrc`.

## Usage

```sh
lando shellenv
```

## Options

```sh
--channel      Sets the update channel                                                  [array] [choices: "edge", "none", "stable"]
--clear        Clears the lando tasks cache                                                                               [boolean]
--debug        Shows debug output                                                                                         [boolean]
--help         Shows lando or delegated command help if applicable                                                        [boolean]
--verbose, -v  Runs with extra verbosity                                                                                    [count]
--add, -a      Add to shell profile if blank lando will attempt discovery                                                  [string]
--check, -c    Check to see if lando is in PATH                                                                           [boolean]
```
