import { Button, Classes, Dialog, Radio, RadioGroup } from '@blueprintjs/core'
import { Workspace } from 'common/typings'
import _ from 'lodash'
import React, { FC, useEffect, useState } from 'react'
import api from '~/api'
import { toastFailure, toastSuccess } from '~/utils/toaster'

import InviteCode from './InviteCode'

interface Props {
  workspace: Workspace
  isOpen: boolean
  toggle: () => void
  refreshWorkspaces: () => void
}

const RolloutStrategyModal: FC<Props> = props => {
  const [strategy, setStrategy] = useState('anonymous')
  const [inviteCode, setInviteCode] = useState()
  const [allowedUsages, setAllowedUsages] = useState(-1)

  useEffect(() => {
    if (props.workspace) {
      setStrategy(props.workspace.rolloutStrategy || 'anonymous')
      // tslint:disable-next-line: no-floating-promises
      loadRolloutInfo()
    }
  }, [props.workspace, props.isOpen])

  const loadRolloutInfo = async () => {
    const { data } = await api.getSecured().get(`/admin/workspaces/${props.workspace.id}/rollout`)

    setInviteCode(data.inviteCode)
    setAllowedUsages(data.allowedUsages)
    setStrategy(data.rolloutStrategy)
  }

  const submit = async () => {
    try {
      await api.getSecured().post(`/admin/workspaces/${props.workspace.id}/rollout/${strategy}`)
      toastSuccess(`Rollout strategy updated successfully`)
    } catch (err) {
      toastFailure(err.message)
    }
  }

  const inviteRequired = ['anonymous-invite', 'authenticated-invite'].includes(strategy)

  return (
    <Dialog
      isOpen={props.isOpen}
      icon="send-to-graph"
      onClose={() => props.toggle()}
      transitionDuration={0}
      title="Rollout Strategy"
    >
      <div className={Classes.DIALOG_BODY}>
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
            workspaceId={props.workspace.id}
          />
        )}
      </div>

      <div className={Classes.DIALOG_FOOTER}>
        <div className={Classes.DIALOG_FOOTER_ACTIONS}>
          <Button id="btn-submit" text="Submit" onClick={submit} />
        </div>
      </div>
    </Dialog>
  )
}

export default RolloutStrategyModal
