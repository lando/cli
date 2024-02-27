---
title: lando info
description: lando info prints useful information about your app like service connection information and urls.
---

# lando info

Prints info about your app.

Using this command you can see useful information such as:

* Shared container volumes
* Service versions, exposed ports, hostnames and access credentials
* Custom config file locations
* Other depends-on-which-service relevant things

## Usage

```sh
# Get app info
lando info

# Get super deep info about your app (this runs `docker inspect` under the hood)
lando info --deep

# Get super deep data as json
lando info --deep --format json
```

## Options

```sh
--channel      Sets the update channel                                                  [array] [choices: "edge", "none", "stable"]
--clear        Clears the lando tasks cache                                                                               [boolean]
--debug        Shows debug output                                                                                         [boolean]
--help         Shows lando or delegated command help if applicable                                                        [boolean]
--verbose, -v  Runs with extra verbosity                                                                                    [count]
--deep, -d     Get ALL the info                                                                          [boolean] [default: false]
--filter       Filter data by "key=value"                                                                                   [array]
--format       Output in given format: default, json, table                          [string] [choices: "default", "json", "table"]
--path         Only return the value at the given path                                                     [string] [default: null]
--service, -s  Get info for only the specified services                                                                     [array]
```
