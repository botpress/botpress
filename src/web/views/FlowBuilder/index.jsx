import React, { Component } from 'react'
import classnames from 'classnames'
import axios from 'axios'
import _ from 'lodash'
import SplitPane from 'react-split-pane'

import ContentWrapper from '~/components/Layout/ContentWrapper'
import PageHeader from '~/components/Layout/PageHeader'

import Toolbar from './containers/Toolbar'
import Diagram from './containers/Diagram'
import SidePanel from './containers/SidePanel'

const style = require('./style.scss')

export default class FlowBuilder extends Component {
  constructor(props) {
    super(props)
    this.state = {
      flowName: 'Untitled Flow',
      selectedNode: null
    }
  }

  componentDidMount() {}

  onFlowNameChanged(event) {
    this.setState({
      flowName: event.target.value
    })
  }

  onFlowNameKey(event) {
    if (event.keyCode === 13) {
      // Enter
      event.target.blur()
    }
  }

  onFlowNameBlur(event) {
    if (!this.state.flowName.length) {
      this.setState({
        flowName: 'Untitled Flow'
      })
    }
  }

  render() {
    //<span>Flow Builder</span>

    const inputWidth = Math.max(120, 20 + 8 * this.state.flowName.length) + 'px'
    const inputClass = classnames({
      [style.flowName]: true,
      [style.defaultValue]: this.state.flowName === 'Untitled Flow'
    })
    return (
      <ContentWrapper stretch={true} className={style.wrapper}>
        <PageHeader className={style.header} width="100%">
          <input
            className={inputClass}
            type="text"
            style={{ width: inputWidth }}
            autocomplete="off"
            value={this.state.flowName}
            onBlur={::this.onFlowNameBlur}
            onChange={::this.onFlowNameChanged}
            onKeyDown={::this.onFlowNameKey}
          />
        </PageHeader>
        <Toolbar
          onSaveFlow={() => {
            console.log('Save Flow', this.diagram)
            const json = this.diagram.serialize()
            console.log(json)
          }}
        />
        <div className={style.workspace}>
          <SplitPane split="vertical" minSize={200} defaultSize={250}>
            <div className={classnames(style.sidePanel)}>
              <SidePanel />
            </div>

            <div className={classnames(style.diagram)}>
              <Diagram />
            </div>
          </SplitPane>
        </div>
      </ContentWrapper>
    )
  }
}
