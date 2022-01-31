import { Button, Callout, Checkbox, Classes, Dialog, FormGroup, Intent } from '@blueprintjs/core'
import { lang, toast } from 'botpress/shared'
import React, { FC, useEffect, useState } from 'react'
import Select from 'react-select'

import api from '~/app/api'

interface Props {
  botId: string | null
  isOpen: boolean
  toggle: () => void
  onRollbackSuccess: () => void
}

const RollbackBotModal: FC<Props> = props => {
  const [revisions, setRevisions] = useState<any>()
  const [selected, setSelected] = useState<any>()
  const [isConfirmed, setConfirmed] = useState(false)
  const [isProcessing, setProcessing] = useState(false)

  useEffect(() => {
    if (props.botId) {
      // eslint-disable-next-line @typescript-eslint/no-floating-promises
      fetchRevisions()
    }
  }, [props.botId])

  const fetchRevisions = async () => {
    const { data } = await api.getSecured().get(`/admin/workspace/bots/${props.botId}/revisions`)

    const revisions = data.payload.revisions.reverse().map(rev => {
      const parts = rev.replace(/\.tgz$/i, '').split('++')
      parts[1] = new Date(parseInt(parts[1], 10)).toLocaleString()
      return {
        label: parts.join(' - '),
        value: rev
      }
    })

    setRevisions(revisions)
  }

  const submit = async () => {
    try {
      setProcessing(true)
      await api
        .getSecured({ timeout: 60000 })
        .post(`/admin/workspace/bots/${props.botId}/rollback`, { revision: selected.value })

      props.onRollbackSuccess()
      closeModal()
    } catch (error) {
      toast.failure(lang.tr('admin.workspace.bots.rollback.error', { msg: error.message }))
    } finally {
      setProcessing(false)
    }
  }

  const closeModal = () => {
    setRevisions(undefined)
    setSelected(undefined)
    setConfirmed(false)
    setProcessing(false)
    props.toggle()
  }

  return (
    <Dialog
      isOpen={props.isOpen}
      icon="undo"
      onClose={closeModal}
      transitionDuration={0}
      title={lang.tr('admin.workspace.bots.rollback.rollbackBot', { bot: props.botId })}
    >
      <div className={Classes.DIALOG_BODY}>
        <FormGroup label={lang.tr('admin.workspace.bots.rollback.selectRevision')}>
          <Select
            id="select-revisions"
            value={selected}
            options={revisions}
            onChange={setSelected}
            tabIndex="1"
            autoFocus={true}
          />
        </FormGroup>

        {selected && (
          <Callout intent={Intent.WARNING}>
            {lang.tr('admin.workspace.bots.rollback.confirm')}
            <br />
            <br />
            <Checkbox
              id="chk-confirm"
              tabIndex={2}
              checked={isConfirmed}
              onChange={e => setConfirmed(e.currentTarget.checked)}
              label={lang.tr('admin.workspace.bots.rollback.confirmYes')}
            />
          </Callout>
        )}
      </div>

      <div className={Classes.DIALOG_FOOTER}>
        <div className={Classes.DIALOG_FOOTER_ACTIONS}>
          <Button
            id="btn-submit-rollback"
            text={isProcessing ? lang.tr('pleaseWait') : lang.tr('admin.workspace.bots.rollback.rollback')}
            tabIndex={3}
            onClick={submit}
            disabled={!selected || !isConfirmed || isProcessing}
            intent={Intent.PRIMARY}
          />
        </div>
      </div>
    </Dialog>
  )
}

export default RollbackBotModal
