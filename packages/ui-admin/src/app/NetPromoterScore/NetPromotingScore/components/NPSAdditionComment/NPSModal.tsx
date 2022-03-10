import { Button, Dialog, FormGroup, TextArea, Classes, Intent } from '@blueprintjs/core'
import { lang, toast } from 'botpress/shared'
import React, { FC, useEffect, useState } from 'react'
import { trackEvent } from '../../SegmentHandler'

interface Props {
  modalValue: boolean
  onChange: any
}

const CreateNPSModalComment: FC<Props> = props => {
  const [isNPSModalOpen, setIsNPSModalOpen] = useState(props.modalValue)
  const [comment, setComment] = useState('')
  const [isButtonDisabled, setIsButtonDisabled] = useState(true)

  useEffect(() => {
    if (comment !== '' && comment.length > 5) {
      return setIsButtonDisabled(false)
    }
    setIsButtonDisabled(true)
  }, [comment])

  const createComment = e => {
    try {
      void trackEvent('nps_comment', { npsComment: comment })
      toggleDialog(e)
      toast.success(lang.tr('admin.netPromotingScore.addComment'))
    } catch {
      toast.failure(lang.tr('admin.netPromoting.error'))
    }
  }

  const toggleDialog = e => {
    setIsNPSModalOpen(!isNPSModalOpen)
    e.target.value = isNPSModalOpen
    props.onChange(e)
  }

  return (
    <Dialog
      title={lang.tr('admin.netPromotingScore.title')}
      icon="add"
      isOpen={isNPSModalOpen}
      onClose={toggleDialog}
      transitionDuration={0}
      canOutsideClickClose={false}
    >
      <form>
        <div className={Classes.DIALOG_BODY}>
          <FormGroup
            label={lang.tr('admin.netPromotingScore.modalTitle')}
            labelFor="comment"
            labelInfo="*"
            helperText={lang.tr('admin.netPromotingScore.helper')}
          >
            <TextArea
              id="input-comment"
              fill={true}
              growVertically={true}
              intent={Intent.PRIMARY}
              large={true}
              value={comment}
              onChange={event => setComment(event.target.value)}
            />
          </FormGroup>
        </div>
        <div className={Classes.DIALOG_FOOTER}>
          <div className={Classes.DIALOG_FOOTER_ACTIONS}>
            <Button
              text={lang.tr('admin.netPromotingScore.button')}
              type="submit"
              onClick={createComment}
              intent={Intent.PRIMARY}
              disabled={isButtonDisabled}
            />
          </div>
        </div>
      </form>
    </Dialog>
  )
}

export default CreateNPSModalComment
