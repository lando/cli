module.exports = {
  lang: 'en-US',
  title: 'Lando',
  description: 'Lando CLI Docs.',
  base: '/cli/',
  head: [
    ['meta', {name: 'viewport', content: 'width=device-width, initial-scale=1'}],
    ['link', {rel: 'icon', href: '/cli/favicon.ico', size: 'any'}],
    ['link', {rel: 'icon', href: '/cli/favicon.svg', type: 'image/svg+xml'}],
    ['link', {rel: 'preconnect', href: '//fonts.googleapis.com'}],
    ['link', {rel: 'preconnect', href: '//fonts.gstatic.com', crossorigin: true}],
    ['link', {rel: 'stylesheet', href: '//fonts.googleapis.com/css2?family=Lexend:wght@500&display=swap'}],
  ],
  theme: '@lando/vuepress-theme-default-plus',
  themeConfig: {
    landoDocs: true,
    logo: '/images/icon.svg',
    docsDir: 'docs',
    docsBranch: 'main',
    repo: 'lando/cli',
    sidebarHeader: {
      enabled: false,
    },
    sidebar: [
      {
        text: 'Usage',
        collapsible: false,
        children: [
          {
            text: 'CLI Usage',
            link: '/cli-usage.md',
          },
        ],
      },
      {
        text: 'Commands',
        collapsible: false,
        children: [
          {
            text: 'lando config',
            link: '/config.md',
          },
          {
            text: 'lando destroy',
            link: '/destroy.md',
          },
          {
            text: 'lando init',
            link: '/init.md',
          },
          {
            text: 'lando info',
            link: '/info.md',
          },
          {
            text: 'lando list',
            link: '/list.md',
          },
          {
            text: 'lando logs',
            link: '/logs.md',
          },
          {
            text: 'lando poweroff',
            link: '/poweroff.md',
          },
          {
            text: 'lando rebuild',
            link: '/rebuild.md',
          },
          {
            text: 'lando restart',
            link: '/restart.md',
          },
          {
            text: 'lando share',
            link: '/share.md',
          },
          {
            text: 'lando ssh',
            link: '/ssh.md',
          },
          {
            text: 'lando start',
            link: '/start.md',
          },
          {
            text: 'lando stop',
            link: '/stop.md',
          },
          {
            text: 'lando version',
            link: '/version.md',
          },
        ],
      },
      '/support.md',
      {text: 'Release Notes', link: 'https://github.com/lando/cli/releases'},
    ],
  },
};
