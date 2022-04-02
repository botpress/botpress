import { Icon } from '@blueprintjs/core'
import { IconNames } from '@blueprintjs/icons'
import * as sdk from 'botpress/sdk'
import { confirmDialog } from 'botpress/shared'
import React from 'react'

import { Panel, Label, Button } from 'react-bootstrap'

import { Status, Scenario } from '../../backend/typings'
import FailureReport from './FailureReport'
import Interaction from './Interaction'
import style from './style.scss'

interface Props {
  scenario: Scenario & Status
  isRunning: boolean
  previews: { [id: string]: string }
  run: (scenario: Scenario) => void
  delete: (scenario: Scenario) => void
}

interface State {
  expanded: boolean
}

class ScenarioComponent extends React.Component<Props, State> {
  state: State = {
    expanded: false
  }

  renderStatusLabel = (status: Status['status']) => {
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

  toggleExpanded = (expanded: boolean) => {
    this.setState({ expanded })
  }

  handleDeleteClick = async () => {
    const shouldDelete = await confirmDialog('Are you sure you want to delete this scenario?', {
      acceptLabel: 'Delete'
    })

    if (shouldDelete) {
      this.props.delete(this.props.scenario)
    }
  }

  handleRunClick = () => {
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
            <Button bsSize="small" className={'btn-light'}>
              <Icon icon={expanded ? IconNames.CHEVRON_UP : IconNames.CHEVRON_DOWN} style={{ margin: 0 }} />
            </Button>
            <span>{scenario.name}</span>
            <span className={style.subtitle}>
              {scenario.status && `${scenario.completedSteps} /`} {scenario.steps.length} interaction
              {scenario.steps.length === 1 ? '' : 's'}
            </span>
          </Panel.Title>
          <div className={style.scenarioStatus}>
            {this.renderStatusLabel(scenario.status)}
            <Button bsSize="small" bsStyle="danger" className={'btn-danger'} onClick={this.handleDeleteClick}>
              <Icon iconSize={11} icon={IconNames.TRASH} />
            </Button>
            <Button
              bsSize="small"
              bsStyle="success"
              className={'btn-success'}
              disabled={isRunning}
              onClick={this.handleRunClick}
            >
              <Icon iconSize={13} icon={IconNames.PLAY} />
            </Button>
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
              />
            </Panel.Footer>
          )}
        </Panel.Collapse>
      </Panel>
    )
  }
}

export default ScenarioComponent
