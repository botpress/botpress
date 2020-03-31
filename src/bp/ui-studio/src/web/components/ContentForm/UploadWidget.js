import React, { Component } from 'react'

import { Button, FormGroup, InputGroup, FormControl, HelpBlock } from 'react-bootstrap'
import { AccessControl } from '~/components/Shared/Utils'
import Loading from '~/components/Util/Loading'
import axios from 'axios'

class UploadWidget extends Component {
  constructor(props) {
    super(props)

    this.state = {
      expanded: !props.value,
      error: null,
      uploading: false
    }
  }

  UNSAFE_componentWillReceiveProps(newProps) {
    if (!newProps.value && !this.state.expanded) {
      this.setState({ expanded: true })
    }
  }

  handleChange = url => {
    this.props.onChange(url)
  }

  expand = () => {
    this.setState({ expanded: true })
  }

  collapse = () => {
    this.setState({ expanded: false })
  }

  startUpload = event => {
    const data = new FormData()
    data.append('file', event.target.files[0])

    this.setState({ error: null, uploading: true }, () => {
      axios
        .post(`${window.BOT_API_PATH}/media`, data, { headers: { 'Content-Type': 'multipart/form-data' } })
        .then(response => {
          this.setState({ expanded: false })
          const { url } = response.data
          this.handleChange(url)
        })
        .catch(e => {
          this.setState({ error: e.message })
        })
        .then(() => {
          this.setState({ uploading: false })
        })
    })
  }

  render() {
    const { $filter: filter, $subtype: subtype, type } = this.props.schema
    if (type !== 'string' || subtype !== 'media') {
      return null
    }

    const { expanded, uploading, error } = this.state

    return (
      <AccessControl
        operation="write"
        resource="bot.media"
        fallback={
          <em>You don&apos;t have permission to upload files for this bot. Please contact the system administrator.</em>
        }
      >
        <FormGroup>
          {!expanded ? (
            <InputGroup>
              <FormControl
                type="text"
                placeholder="No file picked yet"
                value={this.props.value || ''}
                disabled
                className="form-control"
                id={this.props.id}
              />

              <InputGroup.Button>
                <Button onClick={this.expand}>{this.props.value ? 'Change...' : 'Pick...'}</Button>
              </InputGroup.Button>
            </InputGroup>
          ) : (
            <HelpBlock>No file picked yet.</HelpBlock>
          )}
        </FormGroup>
        {expanded && !uploading && (
          <FormGroup>
            <InputGroup>
              <FormControl
                type="file"
                accept={filter || '*'}
                placeholder={this.props.placeholder || 'Pick file to upload'}
                onChange={this.startUpload}
              />
              <InputGroup.Button>
                <Button bsStyle="link" onClick={this.collapse}>
                  Cancel
                </Button>
              </InputGroup.Button>
            </InputGroup>
          </FormGroup>
        )}
        {expanded && error && (
          <FormGroup validationState="error">
            <HelpBlock>{error}</HelpBlock>
          </FormGroup>
        )}
        {expanded && uploading && <Loading />}
      </AccessControl>
    )
  }
}

export default UploadWidget
