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
```

Verification commands
---------------------

Run the following commands to validate things are rolling as they should.

```bash
# Alas, we need curl for these tests (run this first)
lando ssh -s custom -u root -c "apt update && apt install -y curl"

# Should have Java(OpenJDK) installed
lando ssh -s custom -c "java -version" || echo $? | grep -i "openjdk"

# Should use 8.x as the default Tomcat version
lando ssh -s custom -c "/usr/local/tomcat/bin/version.sh" || echo $? | grep Tomcat\/8.

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
