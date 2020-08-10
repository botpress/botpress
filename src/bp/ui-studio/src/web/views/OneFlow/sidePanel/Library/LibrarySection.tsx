import { Button } from '@blueprintjs/core'
import React, { FC, Fragment } from 'react'
import { connect } from 'react-redux'
import { RootReducer } from '~/reducers'

import style from './style.scss'

type Props = {
  id: string
  title: string
  items: LibrarySectionItem[]
  getIsExpanded: (id: string) => boolean
  toggleExpanded: (id: string) => void
}

export interface LibrarySectionItem {
  title: string
  action?: () => void
}

const LibrarySection: FC<Props> = props => {
  const isExpanded = props.getIsExpanded(props.id)

  return (
    <section>
      <Button
        text={props.title}
        minimal
        icon={isExpanded ? 'chevron-down' : 'chevron-right'}
        onClick={() => props.toggleExpanded(props.id)}
        style={{ paddingLeft: `0px` }}
      />
      {isExpanded &&
        props.items.map(w =>
          w.action ? (
            <Button
              className={style.addBtn}
              onClick={() => w.action()}
              icon="plus"
              style={{ paddingLeft: `23px` }}
              text={w.title}
              minimal
            />
          ) : (
            <Button style={{ paddingLeft: `23px` }} text={w.title} minimal />
          )
        )}
    </section>
  )
}

export default LibrarySection
