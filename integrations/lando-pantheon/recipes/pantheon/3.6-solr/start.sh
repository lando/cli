#!/bin/bash
export CATALINA_HOME=/usr/share/tomcat8
export CATALINA_BASE=/var/lib/tomcat8
LD_LIBRARY_PATH=$LD_LIBRARY_PATH:$CATALINA_HOME/lib
export LD_LIBRARY_PATH

# Set up our solr certs
if [ ! -f "/certs/index.pem" ]; then
  mkdir -p /certs /lando/keys/pantheon/${LANDO_APP_NAME}
  cp -rf /certs/* /lando/keys/pantheon/${LANDO_APP_NAME}/
fi

# Start listening, lurking, waiting
incrond

# Start tomcat
/usr/share/tomcat8/bin/catalina.sh run
