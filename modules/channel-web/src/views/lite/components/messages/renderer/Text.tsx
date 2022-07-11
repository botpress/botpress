import classNames from 'classnames'
import truncate from 'html-truncate'
import React, { useState } from 'react'
import Linkify from 'react-linkify'

import { Renderer } from '../../../typings'
import { renderUnsafeHTML, isRTLText } from '../../../utils'

/**
 * A simple text element with optional markdown
 * @param {boolean} markdown Enable markdown parsing for the given text
 * @param {string} text The text to display
 * @param {boolean} escapeHTML Prevent unsafe HTML rendering when markdown is enabled
 * @param {number} maxLength Enables show more button when text overflows limit
 */
export const Text = (props: Renderer.Text) => {
  const [showMore, setShowMore] = useState(false)
  const { maxLength, markdown, escapeHTML, intl, text } = props
  let hasShowMore

  if (intl && maxLength && text.length > maxLength) {
    hasShowMore = true
  }

  const truncateIfRequired = message => {
    return hasShowMore && !showMore ? truncate(message, maxLength) : message
  }

  let message
  if (markdown) {
    const isUserMessage = !props.isBotMessage
    const shouldEscapeHTML = isUserMessage || escapeHTML
    const html = renderUnsafeHTML(text, shouldEscapeHTML)

    message = <div dangerouslySetInnerHTML={{ __html: truncateIfRequired(html) }} />
  } else {
    message = <p>{truncateIfRequired(text)}</p>
  }

  const rtl = isRTLText.test(text)

  return (
    <Linkify properties={{ target: '_blank' }}>
      <div className={classNames({ rtl })}>{message}</div>

      {hasShowMore && (
        <button type="button" onClick={e => setShowMore(!showMore)} className="bpw-message-read-more">
          {showMore &&
            intl.formatMessage({
              id: 'messages.showLess',
              defaultMessage: 'Show Less'
            })}
          {!showMore &&
            intl.formatMessage({
              id: 'messages.readMore',
              defaultMessage: 'Read More'
            })}
        </button>
      )}
    </Linkify>
  )
}

export default Text
