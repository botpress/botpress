import { Button, Classes, Dialog, Radio, RadioGroup } from '@blueprintjs/core'
import _ from 'lodash'
import React, { FC, useEffect, useState } from 'react'
import api from '~/api'
import { toastFailure, toastSuccess } from '~/utils/toaster'

import { BaseDialog, DialogBody, DialogFooter } from '../Components/BaseDialog'

import InviteCode from './InviteCode'

interface Props {
  workspaceId: string
  isOpen: boolean
  toggle: () => void
  refreshWorkspaces?: () => void
}

const RolloutStrategyModal: FC<Props> = props => {
  const [strategy, setStrategy] = useState('anonymous')
  const [inviteCode, setInviteCode] = useState()
  const [allowedUsages, setAllowedUsages] = useState(-1)

  useEffect(() => {
    if (props.workspaceId) {
      // tslint:disable-next-line: no-floating-promises
      loadRolloutInfo()
    }
  }, [props.workspaceId, props.isOpen])

  const loadRolloutInfo = async () => {
    const { data } = await api.getSecured().get(`/admin/workspaces/${props.workspaceId}/rollout`)

    setInviteCode(data.inviteCode)
    setAllowedUsages(data.allowedUsages)
    setStrategy(data.rolloutStrategy)
  }

  const submit = async () => {
    try {
      await api.getSecured().post(`/admin/workspaces/${props.workspaceId}/rollout/${strategy}`)
      toastSuccess(`Rollout strategy updated successfully`)
      props.refreshWorkspaces && props.refreshWorkspaces()
    } catch (err) {
      toastFailure(err.message)
    }
  }

  const inviteRequired = ['anonymous-invite', 'authenticated-invite'].includes(strategy)

  return (
    <BaseDialog
      title="Rollout Strategy"
      icon="send-to-graph"
      isOpen={props.isOpen}
      onClose={() => props.toggle()}
      size="sm"
    >
      <DialogBody>
        <p>
          The rollout strategy is applied to all bots of the workspace when a user encounters an Auth Gate on the flow.
          Without an Auth Gate, the policy has no effect.
        </p>

        <RadioGroup onChange={e => setStrategy(e.currentTarget.value)} selectedValue={strategy}>
          <Radio id="radio-anonymous" value="anonymous" label="Anonymous users can talk to the bots (default)" />

          <Radio
            id="radio-authenticated"
            value="authenticated"
            label="Authenticated users will be added to the workspace automatically, then can talk to bots"
          />
          <Radio
            id="radio-authorized"
            value="authorized"
            label="Authenticated users with an existing access to the workspace can talk to bots"
          />
          <p>
            <strong>Strategies requiring an invite code</strong>
          </p>

          <Radio
            id="radio-anonymous-invite"
            value="anonymous-invite"
            label="Anonymous users with an invite code can talk to bots"
          />
          <Radio
            id="radio-authenticated-invite"
            value="authenticated-invite"
            label="Authenticated users with an invite code will be added to the workspace, then can talk to bots"
          />
        </RadioGroup>
        <br />
        {inviteRequired && (
          <InviteCode
            inviteCode={inviteCode}
            allowedUsages={allowedUsages}
            onUpdate={loadRolloutInfo}
            workspaceId={props.workspaceId}
          />
        )}
      </DialogBody>
      <DialogFooter>
        <Button id="btn-submit" text="Submit" onClick={submit} />
      </DialogFooter>
    </BaseDialog>
  )
}

export default RolloutStrategyModal
