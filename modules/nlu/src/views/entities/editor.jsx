import React from 'react'
import SplitterLayout from 'react-splitter-layout'
import style from './style.scss'
import { ListGroupItem, Glyphicon, Label } from 'react-bootstrap'
import _ from 'lodash'

export default class EntityEditor extends React.Component {
  constructor(props) {
    super(props)
    this.synonymInputRef = React.createRef()
    this.occurenceInputRef = React.createRef()
  }

  state = {
    currentOccurence: undefined,
    currentEntity: undefined,
    synonymInput: '',
    occurenceInput: ''
  }

  componentWillReceiveProps(nextProps) {
    if (nextProps.entity !== this.state.currentEntity) {
      this.setState({ currentEntity: nextProps.entity, currentOccurence: undefined })
    }
  }

  onEnterPressed = (event, cb) => {
    const enterKey = 13
    if (event.keyCode === enterKey) {
      cb()
    }
  }

  handleSynonymEnter = event => {
    this.onEnterPressed(event, this.addSynonym)
  }

  addSynonym = () => {
    const synonym = this.state.synonymInput
    let entity = this.state.currentEntity
    let occurence = this.state.currentOccurence

    if (occurence.synonyms.includes(synonym)) {
      return
    }

    occurence.synonyms = [...occurence.synonyms, synonym]
    const index = entity.occurences.findIndex(o => o.name === occurence.name)
    entity.occurences[index] = occurence

    this.synonymInputRef.current.value = ''
    this.setState({ currentEntity: entity, synonymInput: '' }, this.onUpdate)
  }

  removeSynonym = synonym => {
    let occurence = this.state.currentOccurence
    let entity = this.state.currentEntity

    const sIndex = occurence.synonyms.findIndex(s => s === synonym)
    occurence.synonyms.splice(sIndex, 1)

    const eIndex = entity.occurences.findIndex(o => o.name === occurence.name)
    entity.occurences[eIndex] = occurence
    this.setState({ currentEntity: entity }, this.onUpdate)
  }

  onSynonymInputChange = event => {
    const value = event.target.value
    this.setState({ synonymInput: value })
  }

  renderSynonyms = () => {
    const synonyms = this.state.currentOccurence && this.state.currentOccurence.synonyms
    if (!synonyms) {
      return null
    }
    const tags = synonyms.map(s => (
      <div>
        <Label>{s}</Label>
        <Glyphicon glyph="remove" onClick={() => this.removeSynonym(s)} />
      </div>
    ))

    return (
      <div>
        <input
          class="form-control"
          ref={this.synonymInputRef}
          type="text"
          placeholder="Enter a synonym"
          onKeyDown={this.handleSynonymEnter}
          onChange={this.onSynonymInputChange}
        />
        {tags}
      </div>
    )
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
    const entity = this.state.currentEntity
    const index = entity.occurences.findIndex(o => o.name === occurence.name)

    entity.occurences.splice(index, 1)
    this.setState({ currentEntity: entity }, this.onUpdate)
  }

  renderOccurences = () => {
    const occurences = this.state.currentEntity.occurences

    if (!occurences) {
      return null
    }

    const list = occurences.map(o => (
      <ListGroupItem className={style.entity} onClick={() => this.selectOccurence(o)}>
        {o.name}
        <Glyphicon glyph="trash" className={style.deleteEntity} onClick={() => this.removeOccurence(o)} />
      </ListGroupItem>
    ))

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
        {list}
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
        <SplitterLayout secondaryInitialSize={350} secondaryMinSize={200}>
          <div>{this.renderOccurences()}</div>
          <div>{this.renderSynonyms()}</div>
        </SplitterLayout>
      </div>
    )
  }
}
