import React from 'react'

import { Button, FormGroup, InputGroup } from '@blueprintjs/core'

export default class Basic extends React.Component<BasicSettingProps, BasicSettingState> {
  state = {
    userId: '',
    externalAuthToken: ''
  }

  componentDidMount() {
    this.setState({
      userId: this.props.store.config.userId
    })
  }

  saveSettings = () => {
    this.props.store.setUserId(this.state.userId)
  }

  handleUserIdChanged = event => this.setState({ userId: event.target.value })
  handleAuthChanged = event => this.setState({ externalAuthToken: event.target.value })

  render() {
    return (
      <div>
        <FormGroup helperText={'Changes the User ID stored on your browser'} inline={true}>
          <InputGroup
            name="userId"
            value={this.state.userId}
            onChange={this.handleUserIdChanged}
            placeholder="User ID"
          />
        </FormGroup>

        <FormGroup helperText={'Must be a valid JWT Token'} inline={true}>
          <InputGroup
            name="externalAuthToken"
            value={this.state.externalAuthToken}
            onChange={this.handleAuthChanged}
            placeholder="External Authentication Token"
          />
        </FormGroup>

        <Button onClick={this.saveSettings}>Save</Button>
      </div>
    )
  }
}

interface BasicSettingProps {
  store: any
}

interface BasicSettingState {
  userId: string
  externalAuthToken: string
}
