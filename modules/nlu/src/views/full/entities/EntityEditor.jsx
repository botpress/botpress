import React, { Fragment } from 'react'
import style from './style.scss'
import { ListGroupItem, Glyphicon } from 'react-bootstrap'
import _ from 'lodash'
import { WithContext as ReactTags } from 'react-tag-input'
import classNames from 'classnames'
import { PatternEntityEditor } from './PatternEntity'
import { H1 } from '@blueprintjs/core'
import { ListEntityEditor } from './ListEntity'

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

  updateEntity = _.debounce(this.props.onUpdate, 2500)

  render() {
    const { currentEntity } = this.state

    return (
      <Fragment>
        <H1>{currentEntity.name}</H1>
        {currentEntity && currentEntity.type === 'list' && (
          <ListEntityEditor entity={currentEntity} updateEntity={_.debounce(this.updateEntity, 2500)} />
        )}
        {currentEntity && currentEntity.type === 'pattern' && (
          <PatternEntityEditor entity={currentEntity} updateEntity={_.debounce(this.updateEntity, 2500)} />
        )}
      </Fragment>
    )
  }
}
