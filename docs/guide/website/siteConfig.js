/**
 * Copyright (c) 2017-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

// See https://docusaurus.io/docs/site-config for all the possible
// site configuration options.

const siteConfig = {
  title: "| Developer's Guide",
  tagline: 'Guides and references for all you need to know about Botpress',
  url: 'https://botpress.io/docs',
  baseUrl: '/',
  repoUrl: 'https://github.com/botpress/botpress',
  projectName: 'botpress-docs',
  organizationName: 'botpress',

  algolia: {
    apiKey: '570227d66d130d069630e7226c740158',
    indexName: 'botpress',
    algoliaOptions: {
      facetFilters: ['version:VERSION']
    }
  },

  docsSideNavCollapsible: true,
  headerLinks: [
    { doc: 'introduction', label: 'Docs' },
    { href: 'https://botpress.io/reference/', label: 'SDK' },
    { href: 'https://help.botpress.io/', label: 'Community' },
    { href: 'https://github.com/botpress/botpress', label: 'Github' },
    { search: true }
  ],

  headerIcon: 'img/botpress_icon.svg',
  footerIcon: 'img/botpress.svg',
  favicon: 'img/favicon.png',

  colors: {
    primaryColor: '#165FFB',
    secondaryColor: '#cfcfcf'
  },

  copyright: `Copyright © ${new Date().getFullYear()} Botpress, Inc.`,

  highlight: {
    theme: 'default'
  },

  // Add custom scripts here that would be placed in <script> tags.
  scripts: ['https://buttons.github.io/buttons.js', '/js/hotjar.js'],

  // On page navigation for the current documentation page.
  onPageNav: 'separate',
  // No .html extensions for paths.
  cleanUrl: true,

  // Open Graph and Twitter card images.
  ogImage: 'img/docusaurus.png',
  twitterImage: 'img/docusaurus.png',

  editUrl: 'https://github.com/botpress/botpress/edit/master/docs/guide/docs/',
  gaTrackingId: 'UA-90034220-1',
  gaGtag: true
}

module.exports = siteConfig
