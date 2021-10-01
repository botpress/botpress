import { Button } from '@blueprintjs/core'
import { isOperationAllowed, lang, PermissionOperation } from 'botpress/shared'
import React, { FC, useContext, useState } from 'react'

import style from '../../style.scss'
import { Context } from '../Store'

interface Props {
  onSubmit: (content: string) => Promise<void>
}

const CommentForm: FC<Props> = ({ onSubmit }) => {
  const { state } = useContext(Context)
  const [content, setContent] = useState('')

  function currentAgentHasPermission(operation: PermissionOperation): boolean {
    return (
      state.currentAgent?.online &&
      isOperationAllowed({ user: state.currentAgent, resource: 'module.hitlnext', operation })
    )
  }

  function submit(e?: React.MouseEvent) {
    e?.preventDefault()
    void onSubmit(content).then(() => setContent(''))
  }

  function textAreaKeyDown(e: React.KeyboardEvent) {
    if (!e.shiftKey && e.key === 'Enter') {
      submit()
    }
  }

  return (
    <div className={style.commentForm}>
      <textarea
        onKeyDown={textAreaKeyDown}
        disabled={!currentAgentHasPermission('write')}
        value={content}
        placeholder={lang.tr('module.hitlnext.commentForm.addNote')}
        onChange={event => {
          setContent(event.target.value)
        }}
      ></textarea>
      <Button disabled={!currentAgentHasPermission('write')} onClick={submit}>
        {lang.tr('module.hitlnext.commentForm.submit')}
      </Button>
    </div>
  )
}

export default CommentForm
