## v3.4.3 - [October 6, 2021](https://github.com/lando/cli/releases/tag/v3.4.3)

Lando is **free** and **open source** software that relies on contributions from developers like you! If you like Lando then help us spend more time making, updating and supporting it by [contributing](https://github.com/sponsors/lando).

* Fixed broken `/tmp` directory causing `drush` commands to fail in `platformsh` recipe [#3164](https://github.com/lando/lando/issues/3164)
* Improved `libssl` workaround so it runs _before_ `platformsh` build hooks [#3164](https://github.com/lando/lando/issues/3164)

**NOTE:** These release notes may be incomplete, inconsistent, unreliable and generally weird until we complete the [THE GREAT BREAKUP](https://github.com/lando/lando/issues/2989).

## v3.4.2 - [October 5, 2021](https://github.com/lando/cli/releases/tag/v3.4.2)

Lando is **free** and **open source** software that relies on contributions from developers like you! If you like Lando then help us spend more time making, updating and supporting it by [contributing](https://github.com/sponsors/lando).

* HOTFIX release to address expired root certs and `libssl` security update for `platformsh` recipe [#3164](https://github.com/lando/lando/issues/3164)

**NOTE:** These release notes may be incomplete, inconsistent, unreliable and generally weird until we complete the [THE GREAT BREAKUP](https://github.com/lando/lando/issues/2989).

## v3.4.1 - [October 1, 2021](https://github.com/lando/cli/releases/tag/v3.4.1)

Lando is **free** and **open source** software that relies on contributions from developers like you! If you like Lando then help us spend more time making, updating and supporting it by [contributing](https://github.com/sponsors/lando).

* HOTFIX release to address expired root certs and `libssl` security update for `pantheon` recipe [#3162](https://github.com/lando/lando/issues/3162)

**NOTE:** These release notes may be incomplete, inconsistent, unreliable and generally weird until we complete the [THE GREAT BREAKUP](https://github.com/lando/lando/issues/2989).

## v3.4.0 - [September 15, 2021](https://github.com/lando/cli/releases/tag/v3.4.0)

Lando is **free** and **open source** software that relies on contributions from developers like you! If you like Lando then help us spend more time making, updating and supporting it by [contributing](https://github.com/sponsors/lando).

* Added `arm64` variants for still-supported Lando provided images eg `php`, `util`, `pantheon-index` and `pantheon-appserver` [#2688](https://github.com/lando/lando/issues/2688)
* Added version `1.0.1` to `mailhog` service
* Added version `5.1` to `phpmyadmin` service
* Improved `mailhog` so it is now a fully ARMed and operational service [#2688](https://github.com/lando/lando/issues/2688)
* Improved `pantheon` so it is now a mostly ARMed and operational recipe [#2688](https://github.com/lando/lando/issues/2688)
* Improved `varnish` so it is now a fully ARMed and operational service [#2688](https://github.com/lando/lando/issues/2688)
* Fixed bug in `load-keys.sh` which caused keys to not load in some situations eg `alpine:3.14` `grep` [#34](https://github.com/lando/cli/issues/34)

**NOTE:** These release notes may be incomplete, inconsistent, unreliable and generally weird until we complete the [THE GREAT BREAKUP](https://github.com/lando/lando/issues/2989).

## v3.3.2 - [September 10, 2021](https://github.com/lando/cli/releases/tag/v3.3.2)

Lando is **free** and **open source** software that relies on contributions from developers like you! If you like Lando then help us spend more time making, updating and supporting it by [contributing](https://github.com/sponsors/lando).

* Fixed breaking upstream change in `axios@0.21.2` causing some hosting integration API calls eg posting a key to Pantheon to fail

**NOTE:** These release notes may be incomplete, inconsistent, unreliable and generally weird until we complete the [THE GREAT BREAKUP](https://github.com/lando/lando/issues/2989).

## v3.3.1 - [September 8, 2021](https://github.com/lando/cli/releases/tag/v3.3.1)

Lando is **free** and **open source** software that relies on contributions from developers like you! If you like Lando then help us spend more time making, updating and supporting it by [contributing](https://github.com/sponsors/lando).

* Added `devwithlando/util:4`
* Added ability to specify utility container version as part of `lando init`
* Added missing `$PATH` directories `/app/.global/bin`, `/app/.global/vendor/bin` to `platformsh` recipe [#30](https://github.com/lando/cli/pull/30)

**NOTE:** These release notes may be incomplete, inconsistent, unreliable and generally weird until we complete the [THE GREAT BREAKUP](https://github.com/lando/lando/issues/2989).

## v3.3.0 - [August 23, 2021](https://github.com/lando/cli/releases/tag/v3.3.0)

Lando is **free** and **open source** software that relies on contributions from developers like you! If you like Lando then help us spend more time making, updating and supporting it by [contributing](https://github.com/sponsors/lando).

* Added support for `go` versions `1.15` and `1.16` [#14](https://github.com/lando/cli/pull/14)
* Added support for `database.version` in `pantheon.yml` [#16](https://github.com/lando/cli/issues/16)
* Fixed `dotnet` not working due to upstream change in Microsoft registry [#2711](https://github.com/lando/lando/issues/2711)
* Fixed `mssql` not working due to upstream change in Microsoft registry [#2711](https://github.com/lando/lando/issues/2711) [#12](https://github.com/lando/cli/issues/12)
* Fixed `push` in `lagoon` recipe to respect configured Drupal public file path [#3060](https://github.com/lando/lando/issues/3060)
* Fixed `pull` in `lagoon` recipe to not nest files too deeply [#3059](https://github.com/lando/lando/issues/3059)
* Fixed `null` key issue with `lagoon` recipe [#3058](https://github.com/lando/lando/issues/3058)
* Forced usage of `docker-compose-v1` for now [#3075](https://github.com/lando/lando/issues/3075) [#3076](https://github.com/lando/lando/issues/3076) [#3098](https://github.com/lando/lando/issues/3098)
* Introduced signed and notarized binaries as applicable for x64 and arm64 [#5](https://github.com/lando/cli/pull/5)

**NOTE:** These release notes may be incomplete, inconsistent, unreliable and generally weird until we complete the [THE GREAT BREAKUP](https://github.com/lando/lando/issues/2989).

## v3.2.1 - [May 10, 2021](https://github.com/lando/cli/releases/tag/v3.2.1)

Lando is **free** and **open source** software that relies on contributions from developers like you! If you like Lando then help us spend more time making, updating and supporting it by [contributing](https://github.com/sponsors/lando).

* Added support for `postgres` `13` [#2998](https://github.com/lando/lando/pull/2998)
* Added `elasticsearch` support to the `lagoon` recipe [#2996](https://github.com/lando/lando/pull/2996)
* Moved `acquia` recipe into `beta` readiness
* Switched `wordpress` recipe to use `php` `7.4` as the default version [#3004](https://github.com/lando/lando/pull/3004)
* Updated to Docker Desktop `3.3.3`
* Updated to Docker Compose `1.29.1`

**NOTE:** These release notes may be incomplete, inconsistent, unreliable and generally weird until we complete the [THE GREAT BREAKUP](https://github.com/lando/lando/issues/2989).
