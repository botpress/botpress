import { Dialog } from '@blueprintjs/core'
import { lang } from 'botpress/shared'
import _ from 'lodash'
import React, { FC } from 'react'

import Editor, { Props as EditorProps } from '.'

const EditorModal: FC<{ showQnAModal: boolean } & EditorProps> = props => {
  return (
    <Dialog
      title={props.isEditing ? lang.tr('module.qna.edit') : lang.tr('module.qna.create')}
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
