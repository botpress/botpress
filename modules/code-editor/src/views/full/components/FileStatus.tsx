import { SidePanelSection } from 'botpress/ui'
import React, { useState } from 'react'

import { Collapse, Icon } from '@blueprintjs/core'

const FileStatus = props => {
  const [showErrors, setErrorDisplayed] = useState(false)
  const actions = [
    { label: 'Discard', icon: <Icon icon="disable" />, onClick: props.discardChanges },
    { label: 'Save', icon: <Icon icon="floppy-disk" />, onClick: props.onSaveClicked }
  ]

  if (!props.errors || !props.errors.length) {
    return (
      <SidePanelSection label={'File Information'} actions={actions}>
        <p>No error found</p>
      </SidePanelSection>
    )
  }

  return (
    <SidePanelSection label={'File Information'} actions={actions}>
      <div style={{ padding: 5 }}>
        <strong>Warning</strong>
        <p>There are {props.errors.length} errors in your file.</p>
        <p>Please make sure to fix them before saving.</p>

        <span onClick={() => setErrorDisplayed(!showErrors)} style={{ cursor: 'pointer' }}>
          {showErrors && <Icon icon="caret-down" />}
          {!showErrors && <Icon icon="caret-up" />}
          View details
        </span>

        <Collapse isOpen={showErrors}>
          <div style={{ paddingLeft: 15 }}>
            {props.errors.map(x => (
              <div style={{ marginBottom: 10 }}>
                Line <strong>{x.startLineNumber}</strong>
                <br />
                {x.message}
              </div>
            ))}
          </div>
        </Collapse>
      </div>
    </SidePanelSection>
  )
}

export default FileStatus
