Varnish Example
===============

This example exists primarily to test the following documentation:

* [Varnish Service](https://docs.devwithlando.io/tutorials/varnish.html)

Start up tests
--------------

Run the following commands to get up and running with this example.

```bash
# Should start up successfully
lando poweroff
lando start
```

Verification commands
---------------------

Run the following commands to validate things are rolling as they should.

```bash
# Should use varnish 4.1 by default
lando ssh -s defaults -c "varnishd -V" | grep varnish-4.1.11

# Should backend from appserver by default
lando ssh -s defaults -c "curl localhost:6081 | grep sophisticated"

# Should also serve over https if specified
lando ssh -s custom_ssl -c "curl https://localhost | grep sophisticated"

# Shoule use a custom vcl file if specified
lando ssh -s custom -c "cat /etc/varnish/lando.vcl | grep LANDOVARNISH"
lando ssh -s custom -c "env | grep VARNISHD_VCL_SCRIPT | grep /etc/varnish/lando.vcl"
lando ssh -s custom -c "curl -I localhost:6081" | grep X-Lando-Varnish | grep capes

# Should inherit overrides from its generator
lando ssh -s custom -c "env | grep MEGAMAN | grep X"
lando ssh -s custom_ssl -c "env | grep MEGAMAN | grep X"

# Should use a custom backend port when specified
lando ssh -s customport -c "curl http://localhost:6081 | grep SAW"

# Should use a custom backend port with SSL if specified
lando ssh -s customport_ssl -c "curl https://localhost | grep SAW"
```

Destroy tests
-------------

Run the following commands to trash this app like nothing ever happened.

```bash
# Should be destroyed with success
lando destroy -y
lando poweroff
```
