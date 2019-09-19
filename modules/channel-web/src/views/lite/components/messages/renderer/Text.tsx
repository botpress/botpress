import * as React from 'react'
import Linkify from 'react-linkify'

import { Renderer } from '../../../typings'
import { renderUnsafeHTML } from '../../../utils'

/**
 * A simple text element with optional markdown
 * @param {boolean} markdown Enable markdown parsing for the given text
 * @param {string} text The text to display
 * @param {boolean} escapeHTML Prevent unsafe HTML rendering when markdown is enabled
 */
export const Text = (props: Renderer.Text) => {
  let message = <p>{props.text}</p>
  if (props.markdown) {
    const html = renderUnsafeHTML(props.text, props.escapeHTML)

    message = <div dangerouslySetInnerHTML={{ __html: html }} />
  }

  return (
    <Linkify properties={{ target: '_blank' }}>
      <div>{message}</div>
    </Linkify>
  )
}
