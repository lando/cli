'use strict';

const {EOL} = require('os');
const {Listr} = require('listr2');

// we do this to coax out the default renderer class so we can extend it
const listr = new Listr([], {renderer: 'default', fallbackRenderer: 'default'});

class LandoDefaultRenderer extends listr.rendererClass {
  constructor(tasks, options, $renderHook) {
    super(tasks, options, $renderHook);
    this.options.level = options.level || 0;
  }

  createRender(options) {
    options = {
      ...{
        tasks: true,
        bottomBar: true,
        prompt: true,
      },
      ...options,
    };

    const render = [];

    const renderTasks = this.multiLineRenderer(this.tasks, this.options.level);
    const renderBottomBar = this.renderBottomBar();
    const renderPrompt = this.renderPrompt();

    if (options.tasks && renderTasks?.trim().length > 0) render.push(renderTasks);

    if (options.bottomBar && renderBottomBar?.trim().length > 0) render.push((render.length > 0 ? EOL : '') + renderBottomBar);

    if (options.prompt && renderPrompt?.trim().length > 0) render.push((render.length > 0 ? EOL : '') + renderPrompt);

    return render.length > 0 ? render.join(EOL) : '';
  }
}

module.exports = LandoDefaultRenderer;

