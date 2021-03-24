import { Button, ControlGroup, NumericInput, Tab, Tabs } from '@blueprintjs/core'
import { toast } from 'botpress/shared'
import _ from 'lodash'
import React, { FC, useState } from 'react'
import api from '~/app/api'

interface Props {
  workspaceId: string
  inviteCode?: string
  allowedUsages: number
  onUpdate: () => void
}

const InviteCode: FC<Props> = props => {
  const [tab, setTab] = useState<any>('current')
  const [inviteLimit, setInviteLimit] = useState(-1)

  const submit = async () => {
    try {
      await api.getSecured().post(`/admin/workspace/workspaces/${props.workspaceId}/resetInvite`, { inviteLimit })

      toast.success('Invite code updated successfully')
      props.onUpdate()
      setTab('current')
    } catch (err) {
      toast.failure(err.message)
    }
  }

  return (
    <Tabs id="tabs" onChange={t => setTab(t)} selectedTabId={tab}>
      <Tab
        id="current"
        title="Current invite code"
        panel={
          <div>
            Current Code: <strong>{props.inviteCode}</strong>
            <br /> <br />
            Nb. of usage left: {props.allowedUsages === -1 ? 'unlimited' : props.allowedUsages}
          </div>
        }
      />
      <Tab
        id="advanced"
        title="Change invite code"
        panel={
          <div>
            <p>
              Invite codes are generated automatically. Choose how many time the code can be used (-1 = unlimited). Once
              changed, the old code can't be used anymore.
            </p>

            <ControlGroup>
              <NumericInput
                id="input-allowed"
                placeholder="Max number of time it can be used"
                value={inviteLimit}
                onValueChange={value => setInviteLimit(value)}
              />
              <Button text="Generate new code" onClick={submit} />
            </ControlGroup>
          </div>
        }
      />
    </Tabs>
  )
}

export default InviteCode
