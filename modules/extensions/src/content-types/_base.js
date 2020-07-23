module.exports = {
  typingIndicators: {
    typing: {
      type: 'boolean',
      title: 'module.builtin.typingIndicator',
      default: true
    }
  },
  renderer: (data, type) => {
    return {
      ...data,
      type,
      extraProps: {
        BOT_URL: data.BOT_URL
      },
      metadata: {
        ...(data.markdown && { __markdown: true }),
        ...(data.typing && { __typing: true }),
        ...(data.collectFeedback && { __collectFeedback: true })
      }
    }
  }
}
