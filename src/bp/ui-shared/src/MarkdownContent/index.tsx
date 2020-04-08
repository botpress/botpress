import React, { FC } from 'react'

import { renderUnsafeHTML } from '../utils/text'

import { MarkdownContentProps } from './typings'

export const MarkdownContent: FC<MarkdownContentProps> = props => {
  const { content, markdown, escapeHTML } = props
  let message: any = content

  if (markdown) {
    const html = renderUnsafeHTML(content, escapeHTML)

    message = <div dangerouslySetInnerHTML={{ __html: html }} />
  }

  return message || null
}

export default MarkdownContent
