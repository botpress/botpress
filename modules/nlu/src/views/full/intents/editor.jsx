import React from 'react'
import _ from 'lodash'

import style from './style.scss'
import Creatable from 'react-select/lib/Creatable'
import { Tooltip, Icon, Position, Colors } from '@blueprintjs/core'
import { IntentEditor as LiteEditor } from '../../lite/intentEditor/IntentEditor'

// TODO make sure contexts work properly
// TODO move context selector in lite editor

export default class IntentsEditor extends React.Component {
  state = {
    selectedContextOptions: []
  }

  async componentDidMount() {
    this.initiateStateFromProps(this.props)
  }

  componentWillReceiveProps(nextProps) {
    if (nextProps.intent !== this.props.intent || nextProps.contentLang !== this.props.contentLang) {
      this.initiateStateFromProps(nextProps)
    }
  }

  initiateStateFromProps(props) {
    const { contexts } = props && props.intent
    const availableContexts = props.contexts

    const selectedContextOptions =
      contexts &&
      contexts.map(x => {
        return { value: x, label: x }
      })

    this.setState({
      contexts,
      selectedContextOptions,
      availableContexts
    })
  }

  handleChangeContext = selectedContextOptions => {
    this.setState({ selectedContextOptions, contexts: selectedContextOptions.map(x => x.value) })
  }

  render() {
    const { name } = this.props.intent

    return (
      <div className={style.container}>
        <div className={style.header}>
          <div className="pull-left">
            <h1>
              intents/
              <span className={style.intent}>{name}</span>
            </h1>
          </div>
        </div>
        <div className={style.tools}>
          <div className={style.selectContext}>
            <label htmlFor="selectContext">Current contexts</label>
            &nbsp;
            <Tooltip content="You can type in the select bar to add new contexts." position={Position.RIGHT}>
              <Icon color={Colors.GRAY2} icon="info-sign" />
            </Tooltip>
            <Creatable
              id="selectContext"
              isMulti
              onChange={this.handleChangeContext}
              value={this.state.selectedContextOptions}
              options={
                this.state.availableContexts &&
                this.state.availableContexts.map(x => {
                  return { value: x, label: x }
                })
              }
            />
          </div>
        </div>
        <LiteEditor intentName={name} contentLang={this.props.contentLang} bp={this.props.bp} showSlotPanel />
      </div>
    )
  }
}
