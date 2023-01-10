V3 Example
==========

This example exists primarily to test whether we can switch to v3 in the Landofile.

Verification commands
---------------------

Run the following commands to verify things work as expected

```bash
# should use the runtime in the landofile
lando config --path runtime | grep 3

# should use the runtime in the landofile even when different globally
LANDO_CORE_RUNTIME='4' lando config --path runtime | grep 3
```
