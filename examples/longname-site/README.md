Long Sitename Example
============

This example exists to test Lando projects with long names. Note that the sitename is 63 characters (over 64 is unsupported in Lando currently).

Start up tests
--------------

Run the following commands to get up and running with this example.

```bash
# Should poweroff
lando poweroff

# Should initialize basic LEMP
lando init --source remote --remote-url git://github.com/cakephp/cakephp.git --remote-options="--branch 2.10.24 --depth 1" --recipe lemp --webroot . --name lando-the-sitename-that-never-ends-it-goes-on-and-on-my-friends

# Should start up successfully
lando start
```

Verification commands
---------------------

Run the following commands to validate things are rolling as they should.

```bash
# Should be able to access appserver_nginx
lando ssh -s appserver_nginx -c "ps -u root" | grep nginx

# Should be able to access http
curl http://lando-the-sitename-that-never-ends-it-goes-on-and-on-my-friends.lndo.site | grep HELLO

# Should confirm self-signed cert error.
curl --insecure https://lando-the-sitename-that-never-ends-it-goes-on-and-on-my-friends.lndo.site | grep HELLO

# Should be able to retrieve cert
echo quit | openssl s_client -showcerts -servername lando-the-sitename-that-never-ends-it-goes-on-and-on-my-friends -connect lando-the-sitename-that-never-ends-it-goes-on-and-on-my-friends.lndo.site:443 > cacert.pem

```

Destroy tests
-------------

Run the following commands to trash this app like nothing ever happened.

```bash
# Should be destroyed with success
cd lemp
lando destroy -y
lando poweroff
```
