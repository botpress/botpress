import React, { Fragment } from 'react'
import style from './style.scss'
import { ListGroupItem, Glyphicon, OverlayTrigger, Tooltip } from 'react-bootstrap'
import _ from 'lodash'
import { WithContext as ReactTags } from 'react-tag-input'
import classNames from 'classnames'
import { PatternEntityEditor } from './PatternEntity'
import { H1 } from '@blueprintjs/core'

const DEFAULT_STATE = {
  currentOccurence: undefined,
  currentEntity: undefined,
  occurenceInput: '',
  pattern: ''
}

const DEFAULT_ENTITY = {
  sensitive: false,
  fuzzy: true
}

export default class EntityEditor extends React.Component {
  occurenceInputRef = React.createRef()
  state = { ...DEFAULT_STATE }

  static getDerivedStateFromProps(props, state) {
    if (_.get(props, 'entity.name') !== _.get(state, 'currentEntity.name')) {
      return {
        currentEntity: { ...DEFAULT_ENTITY, ...props.entity },
        currentOccurence: _.get(props, 'entity.occurences[0]'),
        pattern: _.get(props, 'entity.pattern')
      }
    } else if (props.entity === undefined) {
      return DEFAULT_STATE
    } else return null // will not update
  }

  onEnterPressed = (event, cb) => {
    const enterKey = 13
    if (event.keyCode === enterKey) {
      cb()
    }
  }

  addSynonym = (occurenceIndex, synonym) => {
    let entity = this.state.currentEntity

    if (entity.occurences[occurenceIndex].synonyms.includes(synonym.text)) {
      // TODO display something
      return
    }

    entity.occurences[occurenceIndex].synonyms.push(synonym.text)

    this.setState({ currentEntity: entity }, this.onUpdate)
  }

  removeSynonym = (occurenceIndex, synonymIndex) => {
    let entity = this.state.currentEntity

    entity.occurences[occurenceIndex].synonyms.splice(synonymIndex, 1)
    this.setState({ currentEntity: entity }, this.onUpdate)
  }

  onSynonymInputChange = event => {
    const value = event.target.value
    this.setState({ synonymInput: value })
  }

  addOccurence = () => {
    const occurence = this.state.occurenceInput
    let entity = this.state.currentEntity

    if (entity.occurences.find(o => o.name === occurence)) {
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
        {occurences.map((o, occIdx) => (
          <ListGroupItem className={style.occurence} key={`nlu_occurence_${o.name}`}>
            <div className={style.occurenceName}>{o.name}</div>
            <ReactTags
              placeholder="Enter a synonym"
              tags={o.synonyms.map(s => ({ id: s.replace(/[^A-Z0-9_-]/gi, '_'), text: s }))}
              handleDelete={index => this.removeSynonym(occIdx, index)}
              handleAddition={e => this.addSynonym(occIdx, e)}
              allowDeleteFromEmptyInput={false}
            />
            <Glyphicon glyph="trash" className={style.occurenceDelete} onClick={() => this.removeOccurence(o)} />
          </ListGroupItem>
        ))}
      </div>
    )
  }

  onUpdate = _.debounce(() => {
    this.props.onUpdate({ ...this.state.currentEntity, pattern: this.state.pattern })
  }, 500)

  handleSensitiveChanged = () => {
    const sensitive = !this.state.currentEntity.sensitive

    this.setState({ currentEntity: { ...this.state.currentEntity, sensitive } }, () => {
      this.props.onUpdate({ ...this.state.currentEntity, sensitive })
    })
  }

  handleFuzzyChanged = () => {
    const fuzzy = !this.state.currentEntity.fuzzy
    const newEntity = { ...this.state.currentEntity, fuzzy }

    this.setState({ currentEntity: newEntity }, () => {
      this.props.onUpdate(newEntity)
    })
  }

  render() {
    const { currentEntity } = this.state

    return (
      <Fragment>
        {/* <div className={style.header}>
          <div>
            <div style={{ display: 'inline-block' }}>
              {!currentEntity && <h1>No entities have been created yet</h1>}
              {currentEntity && <h1>entities / {this.state.currentEntity.name}</h1>}
            </div>

            {currentEntity && (
              <div style={{ display: 'inline-block', float: 'right' }}>
                <input type="checkbox" checked={currentEntity.sensitive} onChange={this.handleSensitiveChanged} />{' '}
                Sensitive
                <OverlayTrigger
                  placement="left"
                  overlay={
                    <Tooltip id="sensitive">
                      Sensitive informations are replaced by * before saving in the database
                    </Tooltip>
                  }
                >
                  <Glyphicon glyph="question-sign" style={{ marginLeft: 5 }} />
                </OverlayTrigger>
              </div>
            )}

            {currentEntity && currentEntity.type === 'list' && (
              <div style={{ display: 'inline-block', float: 'right' }}>
                <input type="checkbox" checked={currentEntity.fuzzy} onChange={this.handleFuzzyChanged} /> Fuzzy
                Matching
                <OverlayTrigger
                  placement="left"
                  overlay={
                    <Tooltip id="fuzzy">
                      Fuzzy matching will find entities even if they don't match exactly. Only the closest entities will
                      be extracted.
                    </Tooltip>
                  }
                >
                  <Glyphicon glyph="question-sign" style={{ marginLeft: 5, marginRight: 10 }} />
                </OverlayTrigger>
              </div>
            )}
          </div>
        </div> */}
        <H1>{this.props.entity.name}</H1>
        {currentEntity && currentEntity.type === 'list' && this.renderOccurences()}
        {currentEntity && currentEntity.type === 'pattern' && (
          <PatternEntityEditor entity={currentEntity} updateEntity={_.debounce(this.props.onUpdate, 2500)} />
        )}
      </Fragment>
    )
  }
}
