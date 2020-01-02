import { Button, Callout, Checkbox, Classes, Dialog, FormGroup, Intent } from '@blueprintjs/core'
import React, { FC, useEffect, useState } from 'react'
import Select from 'react-select'
import { toastFailure } from '~/utils/toaster'

import api from '../../../api'

interface Props {
  botId: string | null
  isOpen: boolean
  toggle: () => void
  onRollbackSuccess: () => void
}

const RollbackBotModal: FC<Props> = props => {
  const [revisions, setRevisions] = useState()
  const [selected, setSelected] = useState()
  const [isConfirmed, setConfirmed] = useState(false)
  const [isProcessing, setProcessing] = useState(false)

  useEffect(() => {
    if (props.botId) {
      // tslint:disable-next-line: no-floating-promises
      fetchRevisions()
    }
  }, [props.botId])

  const fetchRevisions = async () => {
    const { data } = await api.getSecured().get(`/admin/bots/${props.botId}/revisions`)

    const revisions = data.payload.revisions.map(rev => {
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
      await api.getSecured({ timeout: 30000 }).post(`/admin/bots/${props.botId}/rollback`, { revision: selected.value })

      props.onRollbackSuccess()
      closeModal()
    } catch (error) {
      toastFailure(`Error while rollbacking to a previous version: ${error.message}`)
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
      title={`Rollback bot ${props.botId}`}
    >
      <div className={Classes.DIALOG_BODY}>
        <FormGroup label="Select revision">
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
            Are you sure you want to rollback the bot to that revision? All existing content, flows, questions, etc.
            will be overwritten. This can't be undone.
            <br />
            <br />
            <Checkbox
              id="chk-confirm"
              tabIndex={2}
              checked={isConfirmed}
              onChange={e => setConfirmed(e.currentTarget.checked)}
              label="Yes, rollback the bot to that version"
            />
          </Callout>
        )}
      </div>

      <div className={Classes.DIALOG_FOOTER}>
        <div className={Classes.DIALOG_FOOTER_ACTIONS}>
          <Button
            id="btn-submit"
            text={isProcessing ? 'Please wait...' : 'Rollback'}
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
