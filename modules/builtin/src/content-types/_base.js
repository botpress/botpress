module.exports = {
  typingIndicators: {
    typing: {
      type: 'boolean',
      title: 'module.builtin.typingIndicator',
      default: true
    }
  },
  newRenderer: (data, type) => {
    return {
      ...data,
      type,
      metadata: {
        ...(data.markdown && { __markdown: true }),
        ...(data.typing && { __typing: true }),
        extraProps: {
          BOT_URL: data.BOT_URL
        }
      }
    }
  }
}
