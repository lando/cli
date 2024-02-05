---
title: Lando CLI Usage, How Do I Use It?
description: An overview of what the Lando CLI is.
---

# CLI

While Lando is actually a library that can be implemented various ways it ships with a command line interface by default. The command line interface is dynamic which means if it detects a `Landofile` it will augment your list of available commands with any relevant `tooling` that has been set up by that `Landofile`.

**If you do not run most of these commands in a directory that contains a Landofile you will likely not get the expected result.**

::: warning Windows users must use a real, non-emulated, TTY
This is an upstream "restriction" imposed on us by NodeJS and python. We recommend using the shell shipped with [Git for Windows](https://gitforwindows.org/) but only the `cmd.exe` variant NOT the one powered by `minTTY`. That said your safest bet is to use `cmd.exe` or `PowerShell`. Other shells may work but have not been tested.

If your shell does not work you will likely see an error message like `the input device is not a TTY.`
See [https://github.com/nodejs/node/issues/3006](https://github.com/nodejs/node/issues/3006)
:::
