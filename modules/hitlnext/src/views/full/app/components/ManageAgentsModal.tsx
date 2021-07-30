import { FormGroup } from '@blueprintjs/core'
import { WorkspaceUserWithAttributes } from 'botpress/sdk'
import { AxiosInstance } from 'axios'
import { lang, Dialog } from 'botpress/shared'
import React, { Component } from 'react'
import { Button } from 'react-bootstrap'
import { IAgent } from '../../../../types'
import _, { Dictionary } from 'lodash'
import Agent from './Agent'

interface Props {
  bp: { axios: AxiosInstance; events: any }
  filteredAgents: WorkspaceUserWithAttributes[]
  isOpen?: boolean
  toggleOpen?: () => void
  onPasswordReset: (email, password) => void
}

class ManageAgentsModal extends Component<Props> {
  render() {
    return (
      <Dialog.Wrapper
        style={{ height: 300 }}
        title="Manage agents"
        isOpen={this.props.isOpen}
        onClose={this.props.toggleOpen}
      >
        <Dialog.Body>
          <FormGroup label="List of agents">
            <div>
              {this.props.filteredAgents.map(agent => (
                <Agent agent={agent} onPasswordReset={this.props.onPasswordReset} bp={this.props.bp} />
              ))}
            </div>
          </FormGroup>
        </Dialog.Body>
        <Dialog.Footer>
          <Button onClick={this.props.toggleOpen}>Cancel</Button>
        </Dialog.Footer>
      </Dialog.Wrapper>
    )
  }
}

export default ManageAgentsModal
