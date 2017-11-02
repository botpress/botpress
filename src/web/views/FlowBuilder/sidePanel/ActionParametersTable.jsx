import React, { Component } from 'react'
import { Table, Button, Radio, Col, OverlayTrigger, Tooltip } from 'react-bootstrap'
import Form from 'react-jsonschema-form'
import Select from 'react-select'
import axios from 'axios'

const style = require('./style.scss')

export default class NewActionModal extends Component {
  constructor(props) {
    super(props)

    this.state = { properties: {}, data: {} }
  }

  receiveMetadata(metadata) {
    const props = {}

    metadata.args.forEach(arg => {
      props[arg.name] = {
        type: arg.type || 'string',
        minLength: arg.minLength || 0,
        fromMetadata: true
      }
    })

    this.setState({
      properties: props
    })
  }

  componentDidReceiveProps(props) {
    console.log('Did receive props:', props)
    if (props.metadata) {
      this.receiveMetadata(props.metadata)
    }
  }

  renderGenericParamsFilling() {
    const schema = {
      type: 'object',
      required: ['name'],
      properties: {
        name: { type: 'string', minLength: 3 },
        description: { type: 'string' }
      }
    }

    function Tpl(props) {
      const { id, classNames, label, help, required, description, rawErrors = [], children } = props
      return (
        <div className={classNames}>
          <label htmlFor={id}>
            {label}
            {required ? '*' : null}
          </label>
          {description}
          {children}
          {rawErrors.map(error => (
            <div style={{ color: 'blue' }}>
              <h1>{error}</h1>
            </div>
          ))}
          {help}
        </div>
      )
    }

    let formData = {
      name: 'actionName',
      decription: 'empty'
    }

    return (
      <div>
        <div>This function has metadata about parameters.</div>
        <Form schema={schema} FieldTemplate={Tpl} formData={formData} liveValidate />
      </div>
    )
  }

  renderPropertyRow(prop) {
    const metadata = _.get(this, 'props.metadata.args.' + prop) || {}

    const isRequired = metadata.required || false
    const type = metadata.type || 'string'

    const onRowEdit = e => {
      {
        this.state.data[prop]
      }
    }

    return (
      <tr>
        <td>
          <code>
            {prop}
            {isRequired ? '*' : ''}
          </code>
        </td>
        <td>{type}</td>
        <td />
      </tr>
    )
  }

  render() {
    return (
      <Table>
        <thead>
          <tr>
            <th>Parameter</th>
            <th>Type</th>
            <th>Value</th>
          </tr>
        </thead>
        <tbody />
      </Table>
    )
  }
}
