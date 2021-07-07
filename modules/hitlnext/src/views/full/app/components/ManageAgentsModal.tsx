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
}

class ManageAgentsModal extends Component<Props> {
  state = {
    show: false,
    role: null,
    strategy: null
  }

  onClose = () => {
    this.setState({ show: false })
  }

  test = async () => {
    console.log('AENTS FILTERED: ', this.props.filteredAgents)
  }

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
                <Agent agent={agent} />
              ))}
            </div>
          </FormGroup>
        </Dialog.Body>
        <Dialog.Footer>
          <Button onClick={this.props.toggleOpen}>Cancel</Button>
          <Button onClick={this.test}>Test</Button>
        </Dialog.Footer>
      </Dialog.Wrapper>
    )
  }
}

export default ManageAgentsModal
