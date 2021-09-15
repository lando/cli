# docker build -t devwithlando/pantheon-appserver:5.6-3 .

FROM devwithlando/php:5.6-fpm-3

# Version information
ENV WKHTMLTOPDF_VERSION 0.12.6
ENV PHANTOMJS_VERSION 2.1.1
ENV PHANTOMJS_OLD_VERSION 1.7.0
ENV LANDO_TERMINUS_VERSION 2.5.0
ENV TIKA_VERSION 1.18

# Install the additional things that make the pantheon
RUN mkdir -p /usr/share/man/man1 \
  && apt-get update && apt-get install -y \
    openjdk-8-jdk \
  && rm -f /usr/local/etc/php/conf.d/*-memcached.ini \
  && mkdir -p /var/www/.drush \
  && mkdir -p /var/www/.backdrush \
  && mkdir -p /var/www/.composer \
  && mkdir -p /var/www/.drupal \
  && mkdir -p /srv/bin \
  && chown -R www-data:www-data /var/www /srv/bin \
  && wget "https://github.com/pantheon-systems/terminus/releases/download/${LANDO_TERMINUS_VERSION}/terminus.phar" -O /usr/local/bin/terminus \
  && chmod +x /usr/local/bin/terminus \
  && uname -m \
  && cd /tmp && wget "https://github.com/wkhtmltopdf/packaging/releases/download/${WKHTMLTOPDF_VERSION}-1/wkhtmltox_${WKHTMLTOPDF_VERSION}-1.buster_amd64.deb" \
  && cd /tmp && wget "https://github.com/wkhtmltopdf/packaging/releases/download/${WKHTMLTOPDF_VERSION}-1/wkhtmltox_${WKHTMLTOPDF_VERSION}-1.buster_arm64.deb" \
  && /bin/bash -c 'if [[ "$(uname -m)" == "x86_64" ]]; then dpkg -i "/tmp/wkhtmltox_${WKHTMLTOPDF_VERSION}-1.buster_amd64.deb"; fi' \
  && /bin/bash -c 'if [[ "$(uname -m)" == "aarch64" ]]; then dpkg -i "/tmp/wkhtmltox_${WKHTMLTOPDF_VERSION}-1.buster_arm64.deb"; fi' \
  && apt-get install -yf \
  && ln -sf /usr/local/bin/wkhtmltopdf /srv/bin/wkhtmltopdf \
  && cd /tmp && curl -fsSL "https://github.com/Medium/phantomjs/releases/download/v${PHANTOMJS_VERSION}/phantomjs-${PHANTOMJS_VERSION}-linux-x86_64.tar.bz2" | tar -xjv \
  && mv phantomjs-${PHANTOMJS_VERSION}-linux-x86_64/bin/phantomjs /usr/local/bin/phantomjs-${PHANTOMJS_VERSION}-amd64 \
  && chmod +x /usr/local/bin/phantomjs-${PHANTOMJS_VERSION}-amd64 \
  && cd /tmp && wget "https://github.com/fg2it/phantomjs-on-raspberry/releases/download/v${PHANTOMJS_VERSION}-jessie-stretch-arm64/phantomjs" \
  && mv phantomjs /usr/local/bin/phantomjs-${PHANTOMJS_VERSION}-arm64 \
  && chmod +x /usr/local/bin/phantomjs-${PHANTOMJS_VERSION}-arm64 \
  && /bin/bash -c 'if [[ "$(uname -m)" == "x86_64" ]]; then ln -sf /usr/local/bin/phantomjs-${PHANTOMJS_VERSION}-amd64 /srv/bin/phantomjs-${PHANTOMJS_VERSION}; fi' \
  && /bin/bash -c 'if [[ "$(uname -m)" == "aarch64" ]]; then ln -sf /usr/local/bin/phantomjs-${PHANTOMJS_VERSION}-arm64 /srv/bin/phantomjs-${PHANTOMJS_VERSION}; fi' \
  && ls -lsa /usr/local/bin \
  && cd /tmp && curl -fsSL "https://storage.googleapis.com/google-code-archive-downloads/v2/code.google.com/phantomjs/phantomjs-${PHANTOMJS_OLD_VERSION}-linux-x86_64.tar.bz2" | tar -xjv \
  && mv phantomjs-${PHANTOMJS_OLD_VERSION}-linux-x86_64/bin/phantomjs /srv/bin/phantomjs \
  && chmod +x /srv/bin/phantomjs \
  && /bin/bash -c 'if [[ "$(uname -m)" == "aarch64" ]]; then ln -sf /usr/local/bin/phantomjs-${PHANTOMJS_VERSION}-arm64 /srv/bin/phantomjs; fi' \
  && wget "http://archive.apache.org/dist/tika/tika-app-${TIKA_VERSION}.jar" -O /srv/bin/tika-app-${TIKA_VERSION}.jar \
  && chmod +x /srv/bin/tika-app-${TIKA_VERSION}.jar \
  && wget "http://archive.apache.org/dist/tika/tika-app-1.1.jar" -O /srv/bin/tika-app-1.1.jar \
  && chmod +x /srv/bin/tika-app-1.1.jar \
  && apt-get -y clean \
  && apt-get -y autoclean \
  && apt-get -y autoremove \
  && rm -rf /var/lib/apt/lists/* && rm -rf && rm -rf /var/lib/cache/* && rm -rf /var/lib/log/* && rm -rf /tmp/*
