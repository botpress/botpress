import { ContentElement } from 'botpress/sdk'
import classnames from 'classnames'
import _ from 'lodash'
import React, { Fragment, useEffect } from 'react'
import { connect } from 'react-redux'
import { fetchContentItem } from '~/actions'

import withLanguage from '../../../components/Util/withLanguage'

import style from './style.scss'

interface CommentItemProps {
  text: string
  items: { [id: string]: ContentElement }
  contentLang: string
  className: string
}

const CommentItem: React.FunctionComponent<CommentItemProps & typeof mapDispatchToProps> = props => {
  const { text, items, contentLang } = props

  useEffect(() => {
    props.fetchContentItem(text, { force: true, batched: true })
  }, [])

  if (typeof text !== 'string') {
    // only display content elements of type text
    return <div></div>
  }

  const item = items[text]

  const preview = item?.previews?.[contentLang] as string

  return (
    <div className={classnames(props.className, style['action-item'], style.msg)}>
      {preview &&
        preview.split('\n').map((line, i) => (
          <Fragment key={i}>
            {line}
            <br />
          </Fragment>
        ))}
    </div>
  )
}

const mapStateToProps = state => ({ items: state.content.itemsById })
const mapDispatchToProps = { fetchContentItem }

export default connect(mapStateToProps, mapDispatchToProps)(withLanguage(CommentItem))
