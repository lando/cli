---
title: lando restart
description: lando restart stops your lando app and then starts it again, preserving container state.
---

# lando restart

Restarts your app.

[Stops](./stop.md) and then [starts](./start.md) an app. If you wish to rerun your build steps or you've altered your Landofile you should check out [rebuild](./rebuild.md).

::: warning This command no longer invokes any build steps.
As of version `3.0.0-rc1` Lando will no longer run **ANY** build steps on a `lando restart`. For that, use `lando rebuild`.
:::

## Usage

```sh
lando restart
```

## Options

```sh
--channel      Sets the update channel                                                  [array] [choices: "edge", "none", "stable"]
--clear        Clears the lando tasks cache                                                                               [boolean]
--debug        Shows debug output                                                                                         [boolean]
--help         Shows lando or delegated command help if applicable                                                        [boolean]
--verbose, -v  Runs with extra verbosity                                                                                    [count]
```
