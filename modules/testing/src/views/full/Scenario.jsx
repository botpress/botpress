import React from 'react'

import { Panel, Label } from 'react-bootstrap'
import { MdExpandLess, MdExpandMore } from 'react-icons/md'

import style from './style.scss'
import Interaction from './Interaction'
import FailureReport from './FailureReport'

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

  render() {
    const { scenario } = this.props
    const expanded = this.state.expanded || (scenario.status && scenario.status === 'pending')
    return (
      <Panel className={style.scenario} id={scenario.name} expanded={expanded}>
        <Panel.Heading className={style.scenarioHead}>
          <Panel.Title className={style.title} onClick={this.toggleExpanded.bind(this, !expanded)}>
            {expanded && <MdExpandLess />}
            {!expanded && <MdExpandMore />}
            {scenario.name}
          </Panel.Title>
          <div className={style.scenarioStatus}>
            <span>
              {scenario.status && `${scenario.completedSteps}`} / {scenario.steps.length} interactions
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
                  contentElements={this.props.contentElements}
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
                contentElements={this.props.contentElements}
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
