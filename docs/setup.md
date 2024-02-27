---
title: lando setup
description: lando setup installs the constituent components of Lando.
---

# lando setup

Installs and configures needed system dependencies and plugins so you can use `lando` such as:

* **Build Engine** - Docker Desktop on Windows and macOS, Docker Engine on Linux
* **Orchestrator** - Docker Compose v2
* **Common Plugins** - Basically all the plugins that used to be part of Lando Core before v3.21.0


## Usage

```sh
lando setup
```

## Options

```sh
--channel                      Sets the update channel                                  [array] [choices: "edge", "none", "stable"]
--clear                        Clears the lando tasks cache                                                               [boolean]
--debug                        Shows debug output                                                                         [boolean]
--help                         Shows lando or delegated command help if applicable                                        [boolean]
--verbose, -v                  Runs with extra verbosity                                                                    [count]
--build-engine                 The version of the build engine (docker-desktop) to install             [string] [default: "4.27.2"]
--build-engine-accept-license  Accepts the Docker Desktop license during install instead of later        [boolean] [default: false]
--orchestrator                 The version of the orchestrator (docker-compose) to install             [string] [default: "2.24.5"]
--plugin                       Additional plugin(s) to install                                                [array] [default: []]
--skip-common-plugins          Disables the installation of common Lando plugins                         [boolean] [default: false]
--yes, -y                      Runs non-interactively with all accepted default answers                  [boolean] [default: false]
```
