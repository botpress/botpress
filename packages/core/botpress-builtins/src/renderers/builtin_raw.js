export default data => [
  {
    // on: '*',
    text: `${data.title} | ${data.platform} | \`${data.payload}\``,
    typing: false,
    markdown: true // Webchat only
  }
]
