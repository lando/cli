# Lando CLI

This is the Lando CLI. It implements [`@lando/core`](https://github.com/lando/lando/tree/main/plugins) and mixes in a bunch of [plugins](https://github.com/lando/core). It is a light wrapper around  [`yargs`](https://www.npmjs.com/package/yargs) and [`inquirer`](https://www.npmjs.com/package/inquirer) and mostly allows for:

* Dynamically loading `lando` "tasks" based on `pwd`
* Assembling the `lando` configuration
* Bootstrapping the `lando` and `app` objects
* Abstracting out options, args and interactive questions

## Basic Usage

See a list of commands.

```yaml
lando
```

For more info you should check out the [docs](https://docs.lando.dev/cli):

## Issues, Questions and Support

If you have a question or would like some community support we recommend you [join us on Slack](https://launchpass.com/devwithlando).

If you'd like to report a bug or submit a feature request then please [use the issue queue](https://github.com/lando/cli/issues/new/choose) in this repo.

## Changelog

We try to log all changes big and small in both [THE CHANGELOG](https://github.com/lando/cli/blob/main/CHANGELOG.md) and the [release notes](https://github.com/lando/cli/releases).

## Releasing

[Create a release on GitHub](https://docs.github.com/en/repositories/releasing-projects-on-github/managing-releases-in-a-repository) with a [semver](https://semver.org) tag.

## Contributors

<a href="https://github.com/lando/cli/graphs/contributors">
  <img src="https://contrib.rocks/image?repo=lando/cli" />
</a>

Made with [contrib.rocks](https://contrib.rocks).

## Other Selected Resources

* [LICENSE](https://github.com/lando/cli/blob/main/LICENSE.md)
* [The best professional advice ever](https://www.youtube.com/watch?v=tkBVDh7my9Q)
