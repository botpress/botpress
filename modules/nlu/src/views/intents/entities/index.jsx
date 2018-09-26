import React from 'react'
import { Button, Grid, Row, Col } from 'react-bootstrap'
import _ from 'lodash'
import classnames from 'classnames'
import nanoid from 'nanoid'

import CreateEntityModal from './create'

import style from './style.scss'
import colors from '../colors.scss'

export default class EntitiesEditor extends React.Component {
  state = {
    selectedText: null,
    selectedEntity: null,
    showCreateEntity: false,
    selectEntityIndex: 0
  }

  intentEditor = null

  renderNoEntitiesNoSelection() {
    this.recommendedAction = null

    return (
      <div className={style.centerContainer}>
        <div className={style.centerElement}>
          <h1>This intent has no entities defined 😬</h1>
          <Button bsSize="large" bsStyle="success" onClick={this.showCreateEntityModal}>
            Define one
          </Button>
        </div>
      </div>
    )
  }

  renderNoEntitiesSelection() {
    this.recommendedAction = () => {
      this.showCreateEntityModal()
      return 'create-entity'
    }

    return (
      <div className={style.centerContainer}>
        <div className={style.centerElement}>
          <h1>This intent has no entities defined 😬</h1>
          <h3>
            Define a new entity in order to tag <span className={style.selectionText}>"{this.state.selectedText}"</span>
          </h3>
          <Button bsSize="large" bsStyle="success" onClick={this.showCreateEntityModal}>
            Define one
          </Button>
          <div className={style.buttonTip}>
            Press <strong>Enter</strong> while editing
          </div>
        </div>
      </div>
    )
  }

  renderEntitiesNoSelection() {
    const entities = this.getEntities()

    const onDeleteClicked = entity => event => {
      event.preventDefault()
      if (confirm('Are you sure you want to delete this entity from all utterances?')) {
        this.onEntityDeleted(entity.name)
      }
      return false
    }

    const onEditClicked = entity => event => {
      event.preventDefault()
      this.showCreateEntityModal(entity)
      return false
    }

    return (
      <div className={style.normalContainer}>
        <h3>
          {entities.length} Entities <Button onClick={this.showCreateEntityModal}>Define new</Button>
        </h3>
        <hr />
        <ul>
          {entities.map(entity => {
            const className = classnames(style.entityLabel, colors['label-colors-' + entity.colors])
            return (
              <li className={style.entityItem}>
                <span className={className}>{entity.name}</span>
                <span className={style.type}>{entity.type}</span>
                <a href onClick={onDeleteClicked(entity)}>
                  Delete
                </a>
                <a href onClick={onEditClicked(entity)}>
                  Edit
                </a>
              </li>
            )
          })}
        </ul>
      </div>
    )
  }

  tagSelectedText = entityId => {
    this.intentEditor.tagSelected(entityId)
    this.setState({ selectedText: null, selectedEntity: null })
  }

  renderEntitiesSelection() {
    const entities = this.getEntities()

    this.recommendedAction = () => {
      const entity = this.getEntities()[this.state.selectEntityIndex]
      this.tagSelectedText(entity.id)
      return 'create-entity'
    }

    return (
      <div className={style.normalContainer}>
        <h4>
          Tagging selected text <span className={style.selectionText}>"{this.state.selectedText}"</span>
        </h4>
        <hr />
        <ul>
          {entities.map((entity, i) => {
            const className = classnames(style.entityLabel, colors['label-colors-' + entity.colors])
            const shortcutClassname = classnames(style.shortcutLabel, {
              [style.active]: i === this.state.selectEntityIndex
            })
            const onClick = () => {
              const entity = this.getEntities()[i]
              this.tagSelectedText(entity.id)
            }

            return (
              <li>
                <span className={shortcutClassname}>
                  Press <strong>Enter</strong>
                </span>
                <span className={className} onClick={onClick}>
                  {entity.name}
                </span>
                <span className={style.type}>{entity.type}</span>
              </li>
            )
          })}
        </ul>
      </div>
    )
  }

  executeRecommendedAction = intentEditor => {
    this.intentEditor = intentEditor

    if (this.recommendedAction) {
      const action = this.recommendedAction
      this.recommendedAction = null
      return action()
    }

    return null
  }

  hideCreateEntityModal = () => {
    this.setState({
      showCreateEntity: false
    })

    this.createEntityModal && this.createEntityModal.reset()
  }

  showCreateEntityModal = (editingEntity = null) => {
    this.setState({
      showCreateEntity: true,
      editingEntity: editingEntity
    })
  }

  setSelection = (selectedText, selectedEntity, intentEditor) => {
    this.intentEditor = intentEditor

    let selectEntityIndex = 0

    if (selectedEntity) {
      selectEntityIndex = _.findIndex(this.getEntities(), { id: selectedEntity })
    }

    this.setState({ selectedText, selectedEntity, selectEntityIndex: selectEntityIndex })
  }

  getEntities = () => {
    return this.props.entities || []
  }

  moveUp() {
    if (this.state.selectEntityIndex === 0) {
      this.setState({
        selectEntityIndex: this.getEntities().length - 1
      })
    } else {
      this.setState({
        selectEntityIndex: Math.max(this.state.selectEntityIndex - 1, 0)
      })
    }
  }

  moveDown() {
    if (this.state.selectEntityIndex === this.getEntities().length - 1) {
      this.setState({
        selectEntityIndex: 0
      })
    } else {
      this.setState({
        selectEntityIndex: Math.min(this.state.selectEntityIndex + 1, this.getEntities().length - 1)
      })
    }
  }

  onEntityCreated = ({ name, type, id, colors }) => {
    this.hideCreateEntityModal()

    let entities = _.clone(this.getEntities())

    if (id) {
      entities = entities.filter(x => x.id !== id)
    }

    const newEntity = {
      name: name,
      type: type,
      colors: colors || _.random(1, 8),
      id: id || nanoid()
    }

    entities.push(newEntity)

    const updateInfo = {
      oldName: _.get(this.state, 'editingEntity.name'),
      ...newEntity
    }

    this.props.onEntitiesChanged &&
      this.props.onEntitiesChanged(entities, { operation: id ? 'modified' : 'added', ...updateInfo })
  }

  onEntityDeleted = name => {
    const entities = _.clone(this.getEntities()).filter(e => e.name !== name)
    this.props.onEntitiesChanged && this.props.onEntitiesChanged(entities, { operation: 'deleted', name: name })
  }

  render() {
    let dialog = null

    if (this.state.selectedText && this.state.selectedText.length) {
      dialog = this.getEntities().length ? this.renderEntitiesSelection() : this.renderNoEntitiesSelection()
    } else {
      dialog = this.getEntities().length ? this.renderEntitiesNoSelection() : this.renderNoEntitiesNoSelection()
    }

    return (
      <div>
        <CreateEntityModal
          ref={el => (this.createEntityModal = el)}
          axios={this.props.axios}
          show={this.state.showCreateEntity}
          existingEntity={this.state.editingEntity}
          onCreate={this.onEntityCreated}
          onHide={this.hideCreateEntityModal}
        />
        {dialog}
      </div>
    )
  }
}
