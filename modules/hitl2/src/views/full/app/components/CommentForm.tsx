import { Button } from '@blueprintjs/core'
import { isOperationAllowed, lang, PermissionOperation } from 'botpress/shared'
import React, { FC, useContext, useState } from 'react'

import { UserProfile } from '../../../../types'
import style from '../../style.scss'
import { Context } from '../Store'

interface Props {
  onSubmit: (content: string) => Promise<any>
}

const CommentForm: FC<Props> = props => {
  const { state } = useContext(Context)
  const [content, setContent] = useState('')

  function currentAgentHasPermission(operation: PermissionOperation): boolean {
    return isOperationAllowed({ user: state.currentAgent as UserProfile, resource: 'module.hitl2', operation })
  }

  return (
    <div className={style.commentForm}>
      <textarea
        disabled={!currentAgentHasPermission('write')}
        value={content}
        placeholder={lang.tr('module.hitl2.commentForm.addNote')}
        onChange={event => {
          setContent(event.target.value)
        }}
      ></textarea>
      <Button
        disabled={!currentAgentHasPermission('write')}
        onClick={() => {
          // tslint:disable-next-line: no-floating-promises
          props.onSubmit(content).then(() => {
            setContent('')
          })
        }}
      >
        {lang.tr('module.hitl2.commentForm.submit')}
      </Button>
    </div>
  )
}

export default CommentForm
