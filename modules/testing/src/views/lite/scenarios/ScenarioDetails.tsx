import { Button, Collapse, FormGroup, Icon, InputGroup, Intent, TextArea } from '@blueprintjs/core'
import React, { useState } from 'react'

export default props => {
  const [showDetails, setShowDetails] = useState(false)
  const [scenarioName, setScenarioName] = useState('')

  const scenario = JSON.stringify(props.scenario, undefined, 2)
  const save = () => props.onSave(scenarioName, props.scenario)

  return (
    <div>
      <FormGroup label="Name of your Scenario" labelFor="text-input" labelInfo="(required)">
        <InputGroup id="text-input" value={scenarioName} onChange={e => setScenarioName(e.target.value)} />
      </FormGroup>
      <Button onClick={save} disabled={!scenarioName.length} intent={Intent.PRIMARY}>
        Save
      </Button>{' '}
      <Button onClick={props.onDiscard}>Discard</Button>
      <div style={{ marginTop: '10px' }}>
        <span onClick={() => setShowDetails(!showDetails)} style={{ cursor: 'pointer' }}>
          {showDetails && <Icon icon="caret-down" />}
          {!showDetails && <Icon icon="caret-up" />}
          Show details
        </span>
        <Collapse isOpen={showDetails}>
          <TextArea large={true} value={scenario} style={{ width: '100%', height: '400px' }} />
        </Collapse>
      </div>
    </div>
  )
}
