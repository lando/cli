'use strict';

// Modules
const _ = require('lodash');
const fs = require('fs');
const os = require('os');
const path = require('path');
const shell = require('shelljs');

/*
 * Helper to get an executable
 */
const getDockerBin = (bin, base) => {
  // Do platform appropriate things to get started
  const join = (process.platform === 'win32') ? path.win32.join : path.posix.join;
  let binPath = (process.platform === 'win32') ? join(base, `${bin}.exe`) : join(base, bin);

  // Use PATH compose executable on posix if ours does not exist
  if (process.platform !== 'win32' && (!fs.existsSync(binPath) || fs.statSync(binPath).isDirectory())) {
    binPath = _.toString(shell.which(bin));
  }

  // If the binpath still does not exist then we should set to false and handle downstream
  if (!fs.existsSync(binPath)) return false;
  // Otherwise return a normalized binpath
  switch (process.platform) {
    case 'darwin': return path.posix.normalize(binPath);
    case 'linux': return path.posix.normalize(binPath);
    case 'win32': return path.win32.normalize(binPath);
  }
};

/*
 * Helper to get location of docker bin directory
 */
exports.getDockerBinPath = () => {
  switch (process.platform) {
    case 'darwin':
      return '/Applications/Docker.app/Contents/Resources/bin';
    case 'linux':
      return '/usr/share/lando/bin';
    case 'win32':
      const programFiles = process.env.ProgramW6432 || process.env.ProgramFiles;
      const programData = process.env.ProgramData;
      // Check for Docker in 2.3.0.5+ first
      if (fs.existsSync(path.win32.join(programData + '\\DockerDesktop\\version-bin\\docker.exe'))) {
        return path.win32.join(programData + '\\DockerDesktop\\version-bin');
      // Otherwise use the legacy path
      } else {
         return path.win32.join(programFiles + '\\Docker\\Docker\\resources\\bin');
      }
  }
};

/*
 * Helper to get location of docker bin directory
 */
exports.getDockerComposeBinPath = () => {
  switch (process.platform) {
    case 'darwin':
      return '/Applications/Docker.app/Contents/Resources/bin/docker-compose-v1';
    case 'linux':
      return exports.getDockerBinPath();
    case 'win32':
      const programFiles = process.env.ProgramW6432 || process.env.ProgramFiles;
      return path.win32.join(programFiles + '\\Docker\\Docker\\resources\\bin');
  }
};

/*
 * Get docker compose binary path
 */
exports.getComposeExecutable = () => {
  switch (process.platform) {
    case 'darwin':
      return getDockerBin('docker-compose', exports.getDockerComposeBinPath());
    case 'linux':
      return getDockerBin('docker-compose', exports.getDockerComposeBinPath());
    case 'win32':
      return getDockerBin('docker-compose-v1', exports.getDockerComposeBinPath());
  }
};

/*
 * This should only be needed for linux
 */
exports.getDockerExecutable = () => {
  const base = (process.platform === 'linux') ? '/usr/bin' : exports.getDockerBinPath();
  return getDockerBin('docker', base);
};

/*
 * Get oclif home dir based on platform
 */
const getOClifHome = () => {
  switch (process.platform) {
    case 'darwin':
    case 'linux':
      return process.env.HOME || os.homedir() || os.tmpdir();
    case 'win32':
      return process.env.HOME
        || (process.env.HOMEDRIVE && process.env.HOMEPATH && path.join(process.env.HOMEDRIVE, process.env.HOMEPATH))
        || process.env.USERPROFILE
        || windowsHome()
        || os.homedir()
        || os.tmpdir();
  }
};

/*
 * Get oclif base dir based on platform
 */
const getOClifBase= product => {
  const base = process.env['XDG_CACHE_HOME']
    || (process.platform === 'win32' && process.env.LOCALAPPDATA)
    || path.join(getOClifHome(), '.cache');
  return path.join(base, product);
};

const macosCacheDir = product => {
  return process.platform === 'darwin' ? path.join(getOClifHome(), 'Library', 'Caches', product) : undefined;
};

/*
 * This should only be needed for linux
 */
exports.getOclifCacheDir = product => {
  return process.env[`${product.toUpperCase()}_CACHE_DIR`]
    || macosCacheDir(product)
    || getOClifBase(product);
};
