export default {
  typingIndicators: {
    typing: {
      type: 'boolean',
      title: 'common.contentTypes.typingIndicator',
      default: true
    }
  },
  useMarkdown: {
    markdown: {
      type: 'boolean',
      title: 'common.contentTypes.useMarkdown',
      default: true,
      $help: {
        text: 'common.contentTypes.markdownHelp',
        link: 'https://daringfireball.net/projects/markdown/syntax'
      }
    }
  }
}
