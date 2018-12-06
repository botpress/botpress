import React from 'react'
import style from './style.scss'
import { ListGroupItem, Glyphicon } from 'react-bootstrap'
import _ from 'lodash'
import { WithContext as ReactTags } from 'react-tag-input'
import classNames from 'classnames'

export default class EntityEditor extends React.Component {
  constructor(props) {
    super(props)
    this.occurenceInputRef = React.createRef()
  }

  state = {
    currentOccurence: undefined,
    currentEntity: undefined,
    occurenceInput: ''
  }

  static getDerivedStateFromProps(props, state) {
    if (props.entity !== state.currentEntity) {
      return {
        currentEntity: props.entity,
        currentOccurence: props.entity && props.entity.occurences[0]
      }
    }
    return null // Will not update
  }

  onEnterPressed = (event, cb) => {
    const enterKey = 13
    if (event.keyCode === enterKey) {
      cb()
    }
  }

  addSynonym = (occurence, synonym) => {
    let entity = this.state.currentEntity

    if (occurence.synonyms.includes(synonym)) {
      return
    }

    occurence.synonyms = [...occurence.synonyms, synonym]
    const index = entity.occurences.findIndex(o => o.name === occurence.name)
    entity.occurences[index] = occurence

    this.setState({ currentEntity: entity }, this.onUpdate)
  }

  removeSynonym = (occurence, index) => {
    let entity = this.state.currentEntity

    occurence.synonyms.splice(index, 1)

    const eIndex = entity.occurences.findIndex(o => o.name === occurence.name)
    entity.occurences[eIndex] = occurence
    this.setState({ currentEntity: entity }, this.onUpdate)
  }

  onSynonymInputChange = event => {
    const value = event.target.value
    this.setState({ synonymInput: value })
  }

  addOccurence = () => {
    const occurence = this.state.occurenceInput
    let entity = this.state.currentEntity

    if (entity.occurences.includes(occurence)) {
      return
    }

    entity.occurences = [...entity.occurences, { name: occurence, synonyms: [] }]

    this.occurenceInputRef.current.value = ''
    this.setState({ currentEntity: entity, occurenceInput: '' }, this.onUpdate)
  }

  handleOccurenceEnter = event => {
    this.onEnterPressed(event, this.addOccurence)
  }

  onOccurenceInputChange = event => {
    const value = event.target.value
    this.setState({ occurenceInput: value })
  }

  selectOccurence = occurence => {
    if (occurence !== this.state.currentOccurence) {
      this.setState({ currentOccurence: occurence })
    }
  }

  removeOccurence = occurence => {
    const confirm = window.confirm(
      `Are you sure you want to delete the occurence "${occurence.name}" and all its synonyms?`
    )
    if (!confirm) {
      return
    }

    const entity = this.state.currentEntity
    const index = entity.occurences.findIndex(o => o.name === occurence.name)

    entity.occurences.splice(index, 1)
    this.setState({ currentEntity: entity, currentOccurence: entity.occurences[0] }, this.onUpdate)
  }

  renderOccurences = () => {
    const occurences = this.state.currentEntity && this.state.currentEntity.occurences
    if (!occurences) {
      return null
    }

    return (
      <div>
        <input
          className={classNames('form-control', style.occurenceInput)}
          ref={this.occurenceInputRef}
          type="text"
          placeholder="Type to create an occurence"
          onKeyDown={this.handleOccurenceEnter}
          onChange={this.onOccurenceInputChange}
        />
        {occurences.map(o => (
          <ListGroupItem className={style.occurence} key={`nlu_occurence_${o.name}`}>
            <div className={style.occurenceName}>{o.name}</div>
            <ReactTags
              placeholder="Enter a synonym"
              tags={o.synonyms}
              handleDelete={index => this.removeSynonym(o, index)}
              handleAddition={e => this.addSynonym(o, e)}
              allowDeleteFromEmptyInput={false}
            />
            <Glyphicon glyph="trash" className={style.occurenceDelete} onClick={() => this.removeOccurence(o)} />
          </ListGroupItem>
        ))}
      </div>
    )
  }

  onUpdate = () => {
    this.props.onUpdate(this.state.currentEntity)
  }

  renderEmpty() {
    return <h1>No entities have been created yet</h1>
  }

  render() {
    if (!this.state.currentEntity) {
      return this.renderEmpty()
    }

    return (
      <div className={style.container}>
        <div className={style.header}>
          <div className="pull-left">
            <h1>
              entities/
              <span className={style.entity}>{this.state.currentEntity.name}</span>
            </h1>
          </div>
        </div>
        <div>{this.renderOccurences()}</div>
      </div>
    )
  }
}
