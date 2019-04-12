import React from 'react'
import ArrayField from 'react-jsonschema-form/lib/components/fields/ArrayField'
import I18nManager from './I18nManager'
import { Modal, Button } from 'react-bootstrap'

export default class ArrayMl extends I18nManager {
  state = {
    isOpen: false,
    text: []
  }

  componentDidMount() {
    const schemaProps = this.props.schema.items.properties
    const propertyNames = Object.keys(schemaProps)

    const requiredFormat = propertyNames.map(p => schemaProps[p].title).join('|')

    const text =
      this.props.formData && this.props.formData.map(el => propertyNames.map(p => el[p]).join('|')).join('\n')

    this.setState({ text, requiredFormat, propertyNames })
  }

  handleTextareaChanged = event => this.setState({ text: event.target.value })
  toggle = () => this.setState({ isOpen: !this.state.isOpen })

  extractChoices = () => {
    const choices = this.state.text.split('\n').map(line => {
      const splitted = line.split('|')

      return this.state.propertyNames.reduce((result, prop, idx) => {
        result[prop] = splitted[idx]
        return result
      }, {})
    })

    this.handleOnChange(choices)
    this.toggle()
  }

  renderTextarea() {
    return (
      <React.Fragment>
        This input lets you quickly manage the entries of your content element. Add each element on a different line.
        You will have a chance to review your changes after saving on this modal.
        <br />
        <br />
        Expected format: <strong>{this.state.requiredFormat}</strong>
        <textarea
          style={{ width: '100%', height: '80%', marginTop: 8 }}
          onChange={this.handleTextareaChanged}
          value={this.state.text}
        />
      </React.Fragment>
    )
  }

  renderModal() {
    return (
      <Modal
        container={document.getElementById('app')}
        show={this.state.isOpen}
        onHide={this.toggle}
        backdrop={'static'}
        style={{ zIndex: 9999 }}
      >
        <Modal.Header closeButton>
          <Modal.Title>Quick Editor</Modal.Title>
        </Modal.Header>
        <Modal.Body style={{ height: 500 }}>{this.renderTextarea()}</Modal.Body>
        <Modal.Footer>
          <p>
            <Button onClick={this.extractChoices} bsStyle="primary">
              Save
            </Button>
            &nbsp;
            <Button bsStyle="danger" onClick={this.toggle}>
              Cancel
            </Button>
          </p>
        </Modal.Footer>
      </Modal>
    )
  }

  render() {
    return (
      <div>
        <div style={{ float: 'right', position: 'absolute', right: 0 }}>
          <Button onClick={this.toggle} bsStyle="link">
            Quick Editor
          </Button>
        </div>
        {this.renderWrapped(
          <ArrayField {...this.props} formData={this.props.formData} onChange={this.handleOnChange} />
        )}
        {this.renderModal()}
      </div>
    )
  }
}
