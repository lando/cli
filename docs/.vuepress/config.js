import {defineUserConfig} from '@vuepress/cli';
import {defaultThemePlus} from '@lando/vuepress-theme-default-plus';

export default defineUserConfig({
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
  theme: defaultThemePlus({
    landoDocs: true,
    logo: '/images/icon.svg',
    docsDir: 'docs',
    docsBranch: 'main',
    repo: 'lando/cli',
    sidebarHeader: {
      enabled: true,
      title: 'Lando CLI',
      icon: '/images/icon.png',
    },
    sidebar: [
      {
        text: 'Usage',
        link: '/index.html',
      },
      {
        text: 'Commands',
        collapsible: false,
        children: [
          {
            text: 'lando config',
            link: '/config.html',
          },
          {
            text: 'lando destroy',
            link: '/destroy.html',
          },
          {
            text: 'lando init',
            link: '/init.html',
          },
          {
            text: 'lando info',
            link: '/info.html',
          },
          {
            text: 'lando list',
            link: '/list.html',
          },
          {
            text: 'lando logs',
            link: '/logs.html',
          },
          {
            text: 'lando poweroff',
            link: '/poweroff.html',
          },
          {
            text: 'lando rebuild',
            link: '/rebuild.html',
          },
          {
            text: 'lando restart',
            link: '/restart.html',
          },
          {
            text: 'lando share',
            link: '/share.html',
          },
          {
            text: 'lando ssh',
            link: '/ssh.html',
          },
          {
            text: 'lando start',
            link: '/start.html',
          },
          {
            text: 'lando stop',
            link: '/stop.html',
          },
          {
            text: 'lando version',
            link: '/version.html',
          },
        ],
      },
      '/support.html',
      {text: 'Release Notes', link: 'https://github.com/lando/cli/releases'},
    ],
  }),
});
