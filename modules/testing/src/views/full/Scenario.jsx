import React from 'react'

import { Panel, Label, Glyphicon } from 'react-bootstrap'
import { MdExpandLess, MdExpandMore } from 'react-icons/md'

import style from './style.scss'
import Interaction from './Interaction'
import FailureReport from './FailureReport'
import classnames from 'classnames'

class Scenario extends React.Component {
  state = {
    expanded: false
  }

  renderStatusLabel = status => {
    if (!status) {
      return
    }

    let labelStyle = 'default'
    if (status === 'fail') {
      labelStyle = 'danger'
    } else if (status === 'pass') {
      labelStyle = 'success'
    }
    return (
      <h5>
        <Label bsStyle={labelStyle}>{status.toUpperCase()}</Label>
      </h5>
    )
  }

  toggleExpanded = expanded => {
    this.setState({ expanded })
  }

  handleRunClick = e => {
    e.stopPropagation()
    this.props.run(this.props.scenario)
  }

  render() {
    const { scenario, isRunning } = this.props
    const pending = scenario.status && scenario.status === 'pending'
    const expanded = this.state.expanded || pending
    return (
      <Panel className={style.scenario} id={scenario.name} expanded={expanded}>
        <Panel.Heading className={style.scenarioHead}>
          <Panel.Title className={style.title} onClick={this.toggleExpanded.bind(this, !expanded)}>
            {expanded && <MdExpandLess />}
            {!expanded && <MdExpandMore />}
            <span>{scenario.name}</span>
            {!isRunning && (
              <Glyphicon onClick={this.handleRunClick} className={classnames(style.run, 'text-success')} glyph="play" />
            )}
          </Panel.Title>
          <div className={style.scenarioStatus}>
            <span>
              {scenario.status && `${scenario.completedSteps} /`} {scenario.steps.length} interactions
            </span>
            {this.renderStatusLabel(scenario.status)}
          </div>
        </Panel.Heading>
        <Panel.Collapse>
          <Panel.Body className={style.scenarioBody}>
            {scenario.steps.map((step, i) => {
              const success = i < scenario.completedSteps
              const failure = scenario.status === 'fail' && i === scenario.completedSteps
              const skipped = scenario.status === 'fail' && i > scenario.completedSteps

              return (
                <Interaction
                  {...step}
                  key={step.userMessage}
                  previews={this.props.previews}
                  success={success}
                  failure={failure}
                  skipped={skipped}
                  maxChars={50}
                  mismatchIdx={scenario.mismatch ? scenario.mismatch.index : null}
                  style={{ borderBottom: 'solid 1px #eee' }}
                />
              )
            })}
          </Panel.Body>
          {scenario.mismatch && (
            <Panel.Footer className={style.scenarioFooter}>
              <FailureReport
                mismatch={scenario.mismatch}
                failureIdx={scenario.completedSteps + 1}
                skipped={scenario.steps.length - scenario.completedSteps - 1}
                previews={this.props.previews}
                bp={this.props.bp}
              />
            </Panel.Footer>
          )}
        </Panel.Collapse>
      </Panel>
    )
  }
}

export default Scenario
