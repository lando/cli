---
title: Tooling
description: Lando plugins can add additional CLI commands, called "tooling commands" or "tooling."
---

# Tooling From Plugins

Each Landofile may implement _additional_ [tooling commands](https://docs.lando.dev/core/v3/tooling.html) that are only available for that application. These commands are usually wrappers for development tools like `lando composer` or `lando artisan` or `lando npm`.

Run `lando` inside of an app to see if it offers any app specific tooling options. Here is an example of what the default `lamp` recipe will give you. Note the additional app-specific commands like `lando composer` and `lando db-import`.

```bash
Usage: lando <command> [args] [options]

Commands:
  lando composer          Runs composer commands
  lando config            Displays the lando configuration
  lando db-export [file]  Exports database from a service into a file
  lando db-import <file>  Imports a dump file into database service
  lando destroy           Destroys your app
  lando info              Prints info about your app
  lando init              Initializes code for use with lando
  lando list              Lists all running lando apps and containers
  lando logs              Displays logs for your app
  lando mysql             Drops into a MySQL shell on a database service
  lando php               Runs php commands
  lando poweroff          Spins down all lando related containers
  lando rebuild           Rebuilds your app from scratch, preserving data
  lando restart           Restarts your app
  lando share             Shares your local site publicly
  lando ssh               Drops into a shell on a service, runs commands
  lando start             Starts your app
  lando stop              Stops your app
  lando version           Displays the lando version

Options:
  --channel       Sets the update channel
  --clear         Clears the lando tasks cache
  --experimental  Activates experimental features
  --help          Shows lando or delegated command help if applicable
  --verbose, -v   Runs with extra verbosity

Examples:
  lando start            Run lando start
  lando rebuild --help  Get help about using the lando rebuild command
  lando destroy -y -vvv  Run lando destroy non-interactively and with maximum verbosity
  lando --clear          Clear the lando tasks cache

You need at least one command before moving on
```
