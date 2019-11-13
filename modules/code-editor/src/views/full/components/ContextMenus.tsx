import { ContextMenu, Menu, MenuDivider, MenuItem } from '@blueprintjs/core'
import React from 'react'

import { EditableFile } from '../../../backend/typings'

export const showModuleConfigContextMenu = (file: EditableFile, e) => {
  if (!file.botId) {
    ContextMenu.show(
      <Menu>
        <MenuItem
          id="btn-duplicateCurrent"
          icon="duplicate"
          text="Duplicate to current bot"
          onClick={() => this.props.duplicateFile(file, { forCurrentBot: true, keepSameName: true })}
        />
      </Menu>,
      { left: e.clientX, top: e.clientY }
    )
  } else {
    ContextMenu.show(
      <Menu>
        <MenuItem id="btn-delete" icon="delete" text="Delete" onClick={() => this.props.deleteFile(file)} />
      </Menu>,
      { left: e.clientX, top: e.clientY }
    )
  }
}

export const showExampleContextMenu = (file: EditableFile, e) => {
  ContextMenu.show(
    <Menu>
      <MenuItem
        id="btn-duplicateCurrent"
        icon="duplicate"
        text={file.type === 'action' ? 'Copy example to my bot' : 'Copy example to global hooks'}
        onClick={() => this.props.duplicateFile(file, { forCurrentBot: file.type === 'action', keepSameName: true })}
      />
    </Menu>,
    { left: e.clientX, top: e.clientY }
  )
}

export const showStandardContextMenu = (file: EditableFile, e, node) => {
  const isDisabled = file.name.startsWith('.')

  ContextMenu.show(
    <Menu>
      <MenuItem id="btn-rename" icon="edit" text="Rename" onClick={() => this.renameTreeNode(node)} />
      <MenuItem id="btn-delete" icon="delete" text="Delete" onClick={() => this.props.deleteFile(file)} />
      <MenuDivider />
      <MenuItem id="btn-duplicate" icon="duplicate" text="Duplicate" onClick={() => this.props.duplicateFile(file)} />
      <MenuDivider />
      <MenuItem
        id="btn-enable"
        icon="endorsed"
        text="Enable"
        disabled={!isDisabled}
        onClick={() => this.props.enableFile(file)}
      />
      <MenuItem
        id="btn-disable"
        icon="disable"
        text="Disable"
        disabled={isDisabled}
        onClick={() => this.props.disableFile(file)}
      />
    </Menu>,
    { left: e.clientX, top: e.clientY }
  )
}
