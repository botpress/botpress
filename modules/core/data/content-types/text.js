module.exports = {
  id: 'lol',
  computeData: (typeId, formData) => formData,
  renderElement: data => [
    {
      // on: '*',
      text: data.text,
      typing: data.typing,
      markdown: true // Webchat only
    }
  ]
}
