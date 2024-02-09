---
title: Default Lando Commands
description: Lando is a CLI driven tool by default, here are all the out of the box commands it runs.
---

# Default Commands

The *usual suspects* are available and you can read more about each of them in detail below.

```bash
Usage: lando <command> [args] [options]

Commands:
  lando config    Displays the lando configuration
  lando destroy   Destroys your app
  lando info      Prints info about your app
  lando init      Initializes code for use with lando
  lando list      Lists all running lando apps and containers
  lando logs      Displays logs for your app
  lando poweroff  Spins down all lando related containers
  lando rebuild   Rebuilds your app from scratch, preserving data
  lando restart   Restarts your app
  lando share     Shares your local site publicly
  lando ssh       Drops into a shell on a service, runs commands
  lando start     Starts your app
  lando stop      Stops your app
  lando version   Displays the lando version

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

Read more about

*   [lando config](config.md)
*   [lando destroy](destroy.md)
*   [lando init](init.md)
*   [lando info](info.md)
*   [lando list](list.md)
*   [lando logs](logs.md)
*   [lando poweroff](poweroff.md)
*   [lando rebuild](rebuild.md)
*   [lando restart](restart.md)
*   [lando share](share.md)
*   [lando ssh](ssh.md)
*   [lando start](start.md)
*   [lando stop](stop.md)
*   [lando version](version.md)
