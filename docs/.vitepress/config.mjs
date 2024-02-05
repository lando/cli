import {createRequire} from 'module';

import {defineConfig} from '@lando/vitepress-theme-default-plus/config';

const require = createRequire(import.meta.url);

const {name, version} = require('../../package.json');
const landoPlugin = name.replace('@lando/', '');

export default defineConfig({
  title: 'Lando CLI',
  description: 'The CLI for Lando.',
  landoDocs: 3,
  landoPlugin,
  version,
  head: [
    ['meta', {name: 'viewport', content: 'width=device-width, initial-scale=1'}],
    ['link', {rel: 'icon', href: '/cli/favicon.ico', size: 'any'}],
    ['link', {rel: 'icon', href: '/cli/favicon.svg', type: 'image/svg+xml'}],
  ],
  themeConfig: {
    sidebar: sidebar(),
  },
});

function sidebar() {
  return [
    {
      text: 'Introduction',
      collapsed: false,
      items: [
        {text: 'Overview', link: '/'},
        {text: 'Default Commands', link: '/defaults'},
        {text: 'Tooling', link: '/tooling'},
      ],
    },
    {
      text: 'Commands',
      collapsed: true,
      items: [
        { text: 'Lando Config', link: '/config' },
        { text: 'Lando Destroy', link: '/destroy' },
        { text: 'Lando Init', link: '/init' },
        { text: 'Lando Info', link: '/info' },
        { text: 'Lando List', link: '/list' },
        { text: 'Lando Logs', link: '/logs' },
        { text: 'Lando Poweroff', link: '/poweroff' },
        { text: 'Lando Rebuild', link: '/rebuild' },
        { text: 'Lando Restart', link: '/restart' },
        { text: 'Lando Share', link: '/share' },
        { text: 'Lando SSH', link: '/ssh' },
        { text: 'Lando Start', link: '/start' },
        { text: 'Lando Stop', link: '/stop' },
        { text: 'Lando Version', link: '/version' }
      ],
    },
    {
      text: 'Contribution',
      collapsed: true,
      items: [
        {text: 'Development', link: '/development'},
        {text: 'Team', link: '/team'},
      ],
    },
    {
      text: 'Help & Support',
      collapsed: true,
      items: [
        {text: 'GitHub', link: 'https://github.com/lando/cli/issues/new/choose'},
        {text: 'Slack', link: 'https://www.launchpass.com/devwithlando'},
        {text: 'Contact Us', link: '/support'},
      ],
    },
    {text: 'Examples', link: 'https://github.com/lando/cli/tree/main/examples'},
  ];
};
