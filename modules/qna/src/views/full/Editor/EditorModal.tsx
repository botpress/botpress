import { Dialog } from '@blueprintjs/core'
import _ from 'lodash'
import React, { FC } from 'react'

import Editor, { Props as EditorProps } from '.'

const EditorModal: FC<{ showQnAModal: boolean } & EditorProps> = props => {
  return (
    <Dialog
      title={props.isEditing ? 'Edit Q&A' : 'Create a new Q&A'}
      icon={props.isEditing ? 'edit' : 'add'}
      isOpen={props.showQnAModal}
      onClose={props.closeQnAModal}
      transitionDuration={0}
      style={{ width: 700 }}
    >
      <Editor {...props} />
    </Dialog>
  )
}

export default EditorModal
