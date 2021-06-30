Tomcat Example
==============

This example exists primarily to test the following documentation:

* [Tomcat Service](https://docs.devwithlando.io/tutorials/tomcat.html)

Start up tests
--------------

Run the following commands to get up and running with this example.

```bash
# Should start up successfully
lando poweroff
lando start

# Should install Curl because we need it for these tests
lando ssh -s custom -u root -c "apt update"
lando ssh -s custom -u root -c "apt install -y curl"
```

Verification commands
---------------------

Run the following commands to validate things are rolling as they should.

```bash
# Should use 8.x as the default Tomcat version
lando ssh -s custom -c "/usr/local/tomcat/bin/version.sh" | grep Tomcat\/8.

# Should be serving our HELLO TOMCAT page
lando ssh -s custom -c "curl http://localhost" || echo $? | grep "HELLO TOMCAT"
```

Destroy tests
-------------

Run the following commands to trash this app like nothing ever happened.

```bash
# Should be destroyed with success
lando destroy -y
lando poweroff
```
