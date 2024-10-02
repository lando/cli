import {createRequire} from 'module';

import {defineConfig} from '@lando/vitepress-theme-default-plus/config';

const require = createRequire(import.meta.url);

// get plugin stuff
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
    contributors: {
      merge: 'name',
      debotify: true,
      include: [
        {
          name: 'Mike Pirog',
          email: 'mike@thinktandem.io',
          title: 'Co-founder',
          org: 'lando.dev',
          orgLink: 'https://lando.dev',
          desc: 'SLAVE4U',
          links: [
            {icon: 'github', link: 'https://github.com/pirog'},
            {icon: 'x', link: 'https://x.com/pirogcommamike'},
          ],
          sponsor: 'https://lando.dev/sponsor',
          maintainer: true,
          mergeOnly: true,
        },
        {
          avatar: 'https://avatars.githubusercontent.com/u/1153738',
          name: 'Alec Reynolds',
          email: 'alec+git@thinktandem.io',
          title: 'Co-founder',
          org: 'lando.dev',
          orgLink: 'https://lando.dev',
          desc: 'A chill dude',
          links: [
            {icon: 'github', link: 'https://github.com/reynoldsalec'},
            {icon: 'x', link: 'https://x.com/reynoldsalec'},
          ],
          sponsor: 'https://lando.dev/sponsor',
          maintainer: true,
          mergeOnly: true,
        },
      ],
    },
    multiVersionBuild: {
      satisfies: '>=3.21.2',
    },
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
        {text: 'lando exec <span class="VPBadge success" vertical="middle"><small>NEW!</small></span>', link: '/exec'},
        {text: 'lando info', link: '/info'},
        {text: 'lando init', link: '/init'},
        {text: 'lando list', link: '/list'},
        {text: 'lando logs', link: '/logs'},
        {text: 'lando poweroff', link: '/poweroff'},
        {text: 'lando rebuild', link: '/rebuild'},
        {text: 'lando restart', link: '/restart'},
        {text: 'lando ssh <span class="VPBadge danger" vertical="middle"><small>DEPRECATED</small></span>', link: '/ssh'},
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
