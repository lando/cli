#!/bin/bash
set -eo pipefail

# Get the lando logger
. /helpers/log.sh

# Set the module
LANDO_MODULE="platformsh-hackalicious"

lando_pink "Manually Installing DPKG..."
cd /tmp
wget http://ftp.us.debian.org/debian/pool/main/d/dpkg/dpkg_1.18.25_amd64.deb
ar x dpkg_1.18.25_amd64.deb
cd /
tar xvf /tmp/data.tar.xz
cd /tmp
tar xvf control.tar.gz
./postinst configure
mv -f conffiles /
rm -f dpkg_1.18.25_amd64.deb

lando_pink "Manually Installing gcc-6-base, libc6, & libgcc1..."
wget http://ftp.us.debian.org/debian/pool/main/g/gcc-6/gcc-6-base_6.3.0-18+deb9u1_amd64.deb
wget http://ftp.us.debian.org/debian/pool/main/g/glibc/libc6_2.24-11+deb9u4_amd64.deb
wget http://ftp.us.debian.org/debian/pool/main/g/gcc-6/libgcc1_6.3.0-18+deb9u1_amd64.deb
dpkg --force-depends -i ./*.deb
dpkg --configure -a

lando_pink "Manually Installing perl-base..."
wget http://ftp.us.debian.org/debian/pool/main/p/perl/perl-base_5.24.1-3+deb9u7_amd64.deb
dpkg -i --ignore-depends=dpkg perl-base_5.24.1-3+deb9u7_amd64.deb

lando_pink "Manually Installing debconf..."
wget http://ftp.us.debian.org/debian/pool/main/d/debconf/debconf_1.5.61_all.deb
dpkg -i debconf_1.5.61_all.deb

lando_pink "Manually Installing libssl1..."
wget http://security.debian.org/debian-security/pool/updates/main/o/openssl1.0/libssl1.0.2_1.0.2u-1~deb9u6_amd64.deb
dpkg -i libssl1.0.2_1.0.2u-1~deb9u6_amd64.deb

lando_pink "Resetting /tmp..."
chmod 777 /tmp
