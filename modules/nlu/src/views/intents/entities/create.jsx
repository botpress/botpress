import React from 'react'
import Select from 'react-select'
import { Button, Modal } from 'react-bootstrap'
import _ from 'lodash'

import style from './style.scss'

require('react-select/dist/react-select.css')

export default class EntitiesEditor extends React.Component {
  initialState = {
    entityName: null,
    entityType: null,
    entityId: null,
    entityColors: null
  }

  state = Object.assign(
    {},
    {
      availableEntities: null
    },
    this.initialState
  )

  fetchAvailableEntities = () => {
    return this.props.axios.get(`/api/ext/nlu/entities`).then(res => {
      this.setState({
        availableEntities: res.data
      })
    })
  }

  onNameChange = event => {
    this.setState({ entityName: event.target.value.replace(/[^A-Z0-9_-]/gi, '_') })
  }

  onEntityTypeChange = selected => {
    this.setState({ entityType: selected })
  }

  componentDidMount() {
    this.fetchAvailableEntities()
    this.initializeFromProps()
  }

  componentWillReceiveProps(nextProps) {
    this.initializeFromProps(nextProps)
  }

  initializeFromProps(props) {
    props = props || this.props
    const editingEntity = props.existingEntity || {}

    this.setState({
      entityName: editingEntity.name,
      entityType: { value: editingEntity.type, label: editingEntity.type },
      entityId: editingEntity.id,
      entityColors: editingEntity.colors
    })
  }

  reset = () => {
    this.setState(this.initialState)
  }

  render() {
    const entityType = this.state.entityType && this.state.entityType.value
    const options = this.state.availableEntities && this.state.availableEntities.map(e => ({ value: e, label: e }))

    const isValid = entityType && entityType.length && this.state.entityName && this.state.entityName.length

    const onSave = () => {
      const props = {
        name: this.state.entityName,
        type: entityType,
        id: this.state.entityId,
        colors: this.state.entityColors
      }
      this.props.onCreate(props)
    }

    return (
      <Modal show={this.props.show} bsSize="small" onHide={this.props.onHide} animation={false}>
        <Modal.Header closeButton>
          <Modal.Title>Create Entity</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <h4>Name of the entity</h4>
          <input
            tabIndex="1"
            autoFocus
            className={style.entityNameInput}
            value={this.state.entityName}
            placeholder="Type a name here"
            onChange={this.onNameChange}
          />

          <h4>Entity type</h4>
          <Select
            tabIndex="2"
            name="entity-type"
            value={entityType}
            onChange={this.onEntityTypeChange}
            options={options}
          />
        </Modal.Body>
        <Modal.Footer>
          <Button tabIndex="3" bsStyle="primary" disabled={!isValid} onClick={onSave}>
            Create
          </Button>
        </Modal.Footer>
      </Modal>
    )
  }
}
