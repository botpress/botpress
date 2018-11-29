import React from 'react'
import SplitterLayout from 'react-splitter-layout'
import style from './style.scss'
import { ListGroupItem, Glyphicon, FormControl, Label } from 'react-bootstrap'
import _ from 'lodash'

export default class EntityEditor extends React.Component {
  constructor(props) {
    super(props)
    this.synonymInputRef = React.createRef()
  }

  state = {
    occurence: undefined,
    entity: undefined,
    synonym: ''
  }

  componentWillReceiveProps(nextProps) {
    if (nextProps.entity !== this.state.entity) {
      this.setState({ entity: nextProps.entity, occurence: undefined })
    }
  }

  handleEnter = event => {
    const enterKey = 13
    if (event.keyCode === enterKey) {
      this.addSynonym()
    }
  }

  addSynonym = () => {
    const synonym = this.state.synonym
    let entity = this.state.entity
    let occurence = this.state.occurence

    if (occurence.synonyms.includes(synonym)) {
      return
    }

    const index = entity.occurences.findIndex(o => o.name === occurence.name)
    entity.occurences[index] = occurence
    occurence.synonyms = [...occurence.synonyms, synonym]

    this.setState({ entity, synonym: '' })
    this.synonymInputRef.value = ''
  }

  onSynonymChange = event => {
    const value = event.target.value
    if (this.state.synonym !== value) {
      this.setState({ synonym: value })
    }
  }

  renderSynonyms = () => {
    const synonyms = this.state.occurence && this.state.occurence.synonyms
    if (!synonyms) {
      return null
    }
    const tags = synonyms.map(s => (
      <div>
        <Label>{s}</Label>
      </div>
    ))

    return (
      <div>
        <FormControl
          ref={this.synonymInputRef}
          type="text"
          placeholder="Enter a synonym"
          onKeyDown={this.handleEnter}
          onChange={this.onSynonymChange}
        />
        {tags}
      </div>
    )
  }

  selectOccurence = occurence => {
    if (occurence !== this.state.occurence) {
      this.setState({ occurence })
    }
  }

  renderOccurences = () => {
    const occurences = this.state.entity.occurences

    if (!occurences) {
      return null
    }

    return occurences.map(o => (
      <ListGroupItem className={style.entity} onClick={() => this.selectOccurence(o)}>
        {o.name}
        <Glyphicon glyph="trash" className={style.deleteEntity} />
      </ListGroupItem>
    ))
  }

  onChange = () => {
    this.props.onChange(this.state.entity)
  }

  render() {
    if (!this.state.entity) {
      return null
    }

    return (
      <div className={style.container}>
        <div className={style.header}>
          <div className="pull-left">
            <h1>
              entities/
              <span className={style.intent}>{this.state.entity.name}</span>
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
