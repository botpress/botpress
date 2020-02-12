import { Dialog, HTMLSelect, Label } from '@blueprintjs/core'
import { ActionServer } from 'common/typings'
import React, { FC } from 'react'
import { connect } from 'react-redux'

interface ActionDialogProps {
  actionServers: ActionServer[]
  isOpen: boolean
  onClose: () => void
}

const ActionDialog: FC<ActionDialogProps> = props => {
  const { actionServers, isOpen, onClose } = props
  return (
    <Dialog isOpen={isOpen} title="Edit Action" icon="offline" onClose={() => onClose()}>
      <div>
        <Label>
          Action Server
          <HTMLSelect>
            {actionServers.map(actionServer => (
              <option key={actionServer.baseUrl}>{actionServer.baseUrl}</option>
            ))}
          </HTMLSelect>
        </Label>
      </div>
    </Dialog>
  )
}

const mapStateToProps = state => ({
  actionServers: state.actionServers
})

const mapDispatchToProps = {}

export default connect(mapStateToProps, mapDispatchToProps)(ActionDialog)
