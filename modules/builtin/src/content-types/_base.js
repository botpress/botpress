module.exports = {
  typingIndicators: {
    typing: {
      type: 'boolean',
      title: 'module.builtin.typingIndicator',
      default: true
    }
  },
  useMarkdown: {
    markdown: {
      type: 'boolean',
      title: 'module.builtin.useMarkdown',
      default: true,
      $help: {
        text: 'module.builtin.markdownHelp',
        link: 'https://daringfireball.net/projects/markdown/syntax'
      }
    }
  }
}
