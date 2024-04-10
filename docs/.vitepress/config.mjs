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
  base: '/cli/',
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
      ],
    },
    {
      text: 'Commands',
      collapsed: false,
      items: [
        {text: 'lando config', link: '/config'},
        {text: 'lando destroy', link: '/destroy'},
        {text: 'lando init', link: '/init'},
        {text: 'lando info', link: '/info'},
        {text: 'lando list', link: '/list'},
        {text: 'lando logs', link: '/logs'},
        {text: 'lando poweroff', link: '/poweroff'},
        {text: 'lando rebuild', link: '/rebuild'},
        {text: 'lando restart', link: '/restart'},
        {text: 'lando share', link: '/share'},
        {text: 'lando ssh', link: '/ssh'},
        {text: 'lando start', link: '/start'},
        {text: 'lando stop', link: '/stop'},
        {text: 'lando update', link: '/update'},
        {text: 'lando version', link: '/version'},
      ],
    },
    {
      text: 'Mgmt Commands',
      collapsed: false,
      items: [
        {text: 'lando plugin-add', link: '/plugin-add'},
        {text: 'lando plugin-login', link: '/plugin-login'},
        {text: 'lando plugin-logout', link: '/plugin-logout'},
        {text: 'lando plugin-remove', link: '/plugin-remove'},
        {text: 'lando setup', link: '/setup'},
        {text: 'lando shellenv', link: '/shellenv'},
      ],
    },
    {
      text: 'Contribution',
      collapsed: false,
      items: [
        {text: 'Development', link: '/development'},
        {text: 'Team', link: '/team'},
      ],
    },
    {
      text: 'Help & Support',
      collapsed: false,
      items: [
        {text: 'GitHub', link: 'https://github.com/lando/cli/issues/new/choose'},
        {text: 'Slack', link: 'https://www.launchpass.com/devwithlando'},
        {text: 'Contact Us', link: '/support'},
        {text: 'Guides', link: '/guides'},
        {text: 'Examples', link: 'https://github.com/lando/cli/tree/main/examples'},
      ],
    },
  ];
};
