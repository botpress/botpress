import truncate from 'html-truncate'
import React, { useState } from 'react'
import ReactTextFormat from 'react-text-format'
import { MessageTypeHandlerProps } from '../typings'
import { renderUnsafeHTML } from '../utils'

/**
 * A simple text element with optional markdown
 * @param {boolean} payload.markdown Enable markdown parsing for the given text
 * @param {string} payload.text The text to display
 * @param {number} payload.trimLength Enables show more button when text overflows limit
 */
export const Text = ({ payload, config }: MessageTypeHandlerProps<'text'>) => {
  const [showMore, setShowMore] = useState(false)
  const { trimLength, markdown, text } = payload
  const { intl, escapeHTML } = config
  let hasShowMore = false

  if (trimLength && text.length > trimLength) {
    hasShowMore = true
  }

  const truncateIfRequired = (message: string) => {
    return hasShowMore && trimLength && !showMore ? truncate(message, trimLength) : message
  }

  let message: React.ReactNode
  if (markdown) {
    const html = renderUnsafeHTML(text, escapeHTML)
    message = <div dangerouslySetInnerHTML={{ __html: truncateIfRequired(html) }} />
  } else {
    message = <p>{truncateIfRequired(text)}</p>
  }

  return (
    <ReactTextFormat linkTarget={'_blank'}>
      <div>{message}</div>

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
    </ReactTextFormat>
  )
}
