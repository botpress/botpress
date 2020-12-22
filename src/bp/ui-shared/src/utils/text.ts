import snarkdown from 'snarkdown'

export const renderUnsafeHTML = (message: string = '', escaped?: boolean): string => {
  if (escaped) {
    message = message.replace(/</g, '&lt;').replace(/>/g, '&gt;')
  }

  const html = snarkdown(message)
  return html.replace(/<a href/gi, '<a target="_blank" href')
}
