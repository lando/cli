#!/bin/bash

# @TODO: eventually we have a github action to use hyperdrive

# Update needed keys
curl https://dl.google.com/linux/linux_signing_key.pub | sudo apt-key add -
curl https://cli-assets.heroku.com/apt/release.key | sudo apt-key add -

# Install deps
# We also install docker-ce here to satisify hyperdrive
sudo apt-get update -y
sudo apt-get install -y bc docker-ce

# Spoof the public key
ssh-keygen -t rsa -N "" -C "spoof@circle" -f "$HOME/.ssh/spoofkey"
mv "$HOME/.ssh/spoofkey.pub" "$HOME/.ssh/id_rsa.pub"

# Hyperdrive
curl -Ls https://github.com/lando/hyperdrive/releases/download/v0.6.1/hyperdrive > /tmp/hyperdrive
chmod +x /tmp/hyperdrive
/tmp/hyperdrive -y --name "Lando System" --email landobot@devwithlando.io
