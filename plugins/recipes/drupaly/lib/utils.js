'use strict';

/*
 * Helper to get DRUSH phar url
 */
const getDrushUrl = version => `https://github.com/drush-ops/drush/releases/download/${version}/drush.phar`;

/*
 * Helper to get the phar build command
 */
exports.getDrush = (version, status, getPhar) => getPhar(
  getDrushUrl(version),
  '/tmp/drush.phar',
  '/usr/local/bin/drush',
  status
);
