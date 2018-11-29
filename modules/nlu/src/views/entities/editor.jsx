import React from 'react'
import style from './style.scss'
import { ListGroupItem, Glyphicon } from 'react-bootstrap'
import _ from 'lodash'
import { WithContext as ReactTags } from 'react-tag-input'

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

  componentWillReceiveProps(nextProps) {
    if (nextProps.entity !== this.state.currentEntity) {
      const newEntity = nextProps.entity

      this.setState({ currentEntity: newEntity, currentOccurence: newEntity && newEntity.occurences[0] })
    }
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
          class="form-control"
          ref={this.occurenceInputRef}
          type="text"
          placeholder="Enter an occurence"
          onKeyDown={this.handleOccurenceEnter}
          onChange={this.onOccurenceInputChange}
        />
        {occurences.map(o => (
          <ListGroupItem className={style.occurence}>
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
    return <h1>Create an entity to improve your NLU</h1>
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
              <span className={style.intent}>{this.state.currentEntity.name}</span>
            </h1>
          </div>
        </div>
        <div>{this.renderOccurences()}</div>
      </div>
    )
  }
}
