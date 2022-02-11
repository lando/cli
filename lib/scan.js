'use strict';

// Modules
const _ = require('lodash');
const https = require('https');
const Log = require('./logger');
const Promise = require('./promise');

/*
 * Helper to load request library
 * We do this for testing so we can stub axios and ensure it isn't auto cached
 * via require when we new Lando()
 */
const requestClient = () => {
  const axios = require('axios');
  // @todo: is it ok to turn redirects off here?
  // if we don't we get an error every time http tries to redirect to https
  return axios.create({maxRedirects: 0, httpsAgent: new https.Agent({rejectUnauthorized: false})});
};

// We make this module into a function so we can pass in a logger
module.exports = (log = new Log()) => {
  // Helper to return a url status and log things
  const setStatus = (url, status = true, color = 'green', message = '%s is ready') => {
    log.debug(message, url);
    return {url, status, color};
  };

  // Convenience helpers
  const setGood = url => setStatus(url);
  const setOK = url => setStatus(url, true, 'yellow');
  const setBad = url => setStatus(url, false, 'red', '%s not currently accessible');

  /**
   * Scans URLs to determine if they are up or down.
   *
   * @since 3.0.0
   * @alias lando.scanUrls
   * @param {Array} urls An array of urls like `https://mysite.lndo.site` or `https://localhost:34223`
   * @param {Object} [opts] Options to configure the scan.
   * @param {Integer} [opts.max=7] The amount of times to retry accessing each URL.
   * @param {Array} [opts.waitCode=[400, 502, 404]] The HTTP codes to prompt a retry.
   * @return {Array} An array of objects of the form {url: url, status: true|false}
   * @example
   * // Scan URLs and print results
   * return lando.utils.scanUrls(['http://localhost', 'https://localhost'])
   * .then(function(results) {
   *   console.log(results);
   * });
   */
  const scanUrls = (urls, {max = 7, waitCodes = [400, 502, 404]} = {}) => {
    log.verbose('about to scan urls');
    log.debug('scanning data', {urls, max, waitCodes});

    // Ping the sites for awhile to determine if they are g2g
    return Promise.map(urls, url => Promise.retry(() => {
      // Log the attempt
      log.debug('checking to see if %s is ready.', url);
      // If URL contains a wildcard then immediately set fulfill with yellow status
      if (_.includes(url, '*')) return Promise.resolve(setOK(url));
      // Send REST request.
      return requestClient().get(url)
      // Return good responses
      .then(response => {
        log.debug('scan response %s received', url, {
          status: response && response.status,
          headers: response && response.headers,
        });
        return setGood(url);
      })
      // Retry waitcodes or fail right away if we have a network issue
      .catch(error => {
        const extraInformation = {
          code: error.code,
          message: error.message,
        };
        if (error.response) {
          extraInformation.status = error.response.status;
          extraInformation.headers = error.response.headers;
        }
        log.debug('scan failed for %s', url, extraInformation);

        if (error.code === 'ENOTFOUND') {
          log.debug('ENOTFOUND for %s, setting to bad', url);
          return Promise.resolve(setBad(url));
        }

        if (!error.response) {
          log.debug('No response for %s. Setting to bad', url);
          return Promise.reject(setBad(url));
        }

        if (_.includes(waitCodes, error.response.status)) {
          log.debug('Response for %s, returned http code we should retry for. Setting to bad', url);
          return Promise.reject(setBad(url));
        }

        log.debug('Unkown failure for %s. Setting to good', url);
        return setGood(url);
      });
    }, {max})

    // Catch any error and return an inaccessible url
    .catch(err => setBad(url)))

    // Log and then return scan results
    .then(results => {
      log.verbose('scan completed.');
      log.debug('scan results.', results);
      return results;
    });
  };

  // Return
  return scanUrls;
};
