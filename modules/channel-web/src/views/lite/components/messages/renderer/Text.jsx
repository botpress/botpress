import snarkdown from 'snarkdown'
import Linkify from 'react-linkify'

/**
 * A simple text element with optional markdown
 * @param {boolean} markdown Enable markdown parsing for the given text
 * @param {string} text The text to display
 */
export const Text = props => {
  let message = <p>{props.text}</p>
  if (props.markdown) {
    let html = snarkdown(props.text || '')
    html = html.replace(/<a href/gi, `<a target="_blank" href`)

    message = <div dangerouslySetInnerHTML={{ __html: html }} />
  }

  return (
    <Linkify properties={{ target: '_blank' }}>
      <div>{message}</div>
    </Linkify>
  )
}
