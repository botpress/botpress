import { Menu, MenuItem } from '@blueprintjs/core'
import { lang, TreeView } from 'botpress/shared'
import { LibraryElement } from 'common/typings'
import React, { FC, useCallback, useState } from 'react'
import { connect } from 'react-redux'
import { removeElementFromLibrary } from '~/actions'
import MarkdownRenderer from '~/components/Shared/MarkdownRenderer'
import { RootReducer } from '~/reducers'

import style from '../style.scss'

import Editor from './LiteEditor'

type StateProps = ReturnType<typeof mapStateToProps>
type DispatchProps = typeof mapDispatchToProps

interface OwnProps {
  filter: string
  refreshLibrary: () => void
}

type Props = OwnProps & StateProps & DispatchProps

const nodeRenderer = ({ contentId, type, preview }: LibraryElement) => {
  return {
    label: (
      <div
        className={style.grabbable}
        draggable={true}
        onDragStart={event => {
          event.dataTransfer.setData('diagram-node', JSON.stringify({ contentId, type: 'node', id: type }))
        }}
      >
        <MarkdownRenderer content={preview} noLink={true} size="sm"></MarkdownRenderer>
      </div>
    )
  }
}

const Library: FC<Props> = props => {
  const [isEditOpen, setEditOpen] = useState(false)
  const [editItem, setEditItem] = useState('')

  const getContextMenu = (element: LibraryElement) => {
    return (
      <Menu>
        <MenuItem
          id="btn-remove"
          icon="remove"
          text={lang.tr('studio.flow.removeFromLibrary')}
          onClick={() => {
            props.removeElementFromLibrary(element.contentId)
            props.refreshLibrary()
          }}
        />
      </Menu>
    )
  }

  const onDoubleClick = (element: LibraryElement, elementType) => {
    if (elementType === 'document') {
      setEditItem(element.contentId)
      setEditOpen(true)
    }
  }

  const filters = { text: props.filter, field: 'preview' }
  const toggle = () => setEditOpen(false)

  return (
    <div>
      <TreeView<LibraryElement>
        elements={props.library}
        nodeRenderer={nodeRenderer}
        onContextMenu={getContextMenu}
        onDoubleClick={onDoubleClick}
        filterText={props.filter}
        filterProps="preview"
      />
      <Editor itemId={editItem} isOpen={isEditOpen} toggle={toggle}></Editor>
    </div>
  )
}

const mapStateToProps = (state: RootReducer) => ({
  conditions: state.ndu.conditions,
  library: state.content.library
})

const mapDispatchToProps = {
  removeElementFromLibrary
}

export default connect(mapStateToProps, mapDispatchToProps)(Library)
