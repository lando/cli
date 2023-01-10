Global Example
==============

This example exists primarily to test whether the app uses the globally set runtime.

Verification commands
---------------------

Run the following commands to verify things work as expected

```bash
# should use the global runtime
lando config --path runtime | grep 3
LANDO_CORE_RUNTIME=v4 lando config --path system.runtime | grep 4
```
