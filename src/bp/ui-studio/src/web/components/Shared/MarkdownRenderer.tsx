import React, { FC } from 'react'
import Markdown from 'react-markdown'

import style from './Interface/style.scss'

interface Props {
  content: JSX.Element | string
  size?: 'sm' | 'md'
  noLink?: boolean
}

const MarkdownRenderer: FC<Props> = props => {
  let width = 140
  if (props.size === 'sm') {
    width = 30
  }

  return (
    <Markdown
      source={props.content as any}
      renderers={{
        image: props => <img {...props} style={{ width }} />,
        link: props =>
          !props.noLink && (
            <a href={props.href} target="_blank">
              {props.children}
            </a>
          )
      }}
      className={style.markdownRenderer}
    />
  )
}

export default MarkdownRenderer
