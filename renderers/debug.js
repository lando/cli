'use strict';

const {Listr} = require('listr2');

// we do this to coax out the default renderer class so we can extend it
const listr = new Listr([], {renderer: 'verbose', fallbackRenderer: 'verbose'});

class LandoDebugRenderer extends listr.rendererClass {
  static debug = require('debug')('lando:debug-renderer');

  constructor(tasks, options, $renderHook) {
    super(tasks, options, $renderHook);
    this.options.level = 0;
    const debug = options.log || LandoDebugRenderer.debug;

    // update the logger with our debug wrapper
    this.logger.log = (level, message, options) => {
      const output = debug(this.logger.format(level, message, options));

      if (output && this.logger.options.toStderr.includes(level)) {
        this.logger.process.toStderr(output);
        return;
      }

      if (output) this.logger.process.toStdout(output);
    };
  }
}

module.exports = LandoDebugRenderer;

