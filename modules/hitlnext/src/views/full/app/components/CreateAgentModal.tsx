import { FormGroup } from '@blueprintjs/core'
import { AxiosInstance } from 'axios'
import { lang, Dialog } from 'botpress/shared'
import _ from 'lodash'
import React, { Component } from 'react'
import { Button } from 'react-bootstrap'
import AsyncSelect from 'react-select/lib/AsyncCreatable'
interface Props {
  bp: { axios: AxiosInstance; events: any }
  isOpen?: boolean
  toggleOpen?: () => void
}

class CreateAgentModal extends Component<Props> {
  state = {
    show: false,
    role: null,
    strategy: null,
    selectedUser: null
  }

  onSubmitClick = async () => {
    const { data } = await this.props.bp.axios.post('/mod/hitlnext/agents/create', {
      email: this.state.selectedUser.value
    })
  }
  onClose = () => {
    this.setState({ show: false })
  }
  setSelectedUser = option => {
    this.setState({ selectedUser: option })
  }

  render() {
    return (
      <Dialog.Wrapper title="Create new agent" isOpen={this.props.isOpen} onClose={this.props.toggleOpen}>
        <Dialog.Body>
          <FormGroup label={lang.tr('email')} labelFor="select-email">
            <AsyncSelect
              id="select-email"
              cacheOptions
              defaultOptions
              value={this.state.selectedUser}
              onChange={option => this.setSelectedUser(option as any)}
              autoFocus={true}
            />
          </FormGroup>
        </Dialog.Body>
        <Dialog.Footer>
          <Button onClick={this.props.toggleOpen}>Cancel</Button>
          <Button onClick={this.onSubmitClick}>Create</Button>
        </Dialog.Footer>
      </Dialog.Wrapper>
    )
  }
}

export default CreateAgentModal
