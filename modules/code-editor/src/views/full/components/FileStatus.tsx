import { Collapse, Icon } from '@blueprintjs/core'
import { SidePanelSection } from 'botpress/ui'
import { RootStore } from 'full/store'
import { inject, observer } from 'mobx-react'
import React, { useState } from 'react'

const FileStatus = props => {
  const [showErrors, setErrorDisplayed] = useState(false)
  const actions = [
    { label: 'Discard', icon: <Icon icon="disable" />, onClick: props.editor.discardChanges },
    { label: 'Save', icon: <Icon icon="floppy-disk" />, onClick: props.editor.saveChanges }
  ]

  const problems = props.editor.fileProblems
  if (!problems || !problems.length) {
    return (
      <SidePanelSection label={'File Information'} actions={actions}>
        <React.Fragment />
      </SidePanelSection>
    )
  }

  return (
    <SidePanelSection label={'File Information'} actions={actions}>
      <div style={{ padding: 5 }}>
        <strong>Warning</strong>
        <p>There are {problems.length} errors in your file.</p>
        <p>Please make sure to fix them before saving.</p>

        <span onClick={() => setErrorDisplayed(!showErrors)} style={{ cursor: 'pointer' }}>
          {showErrors && <Icon icon="caret-down" />}
          {!showErrors && <Icon icon="caret-up" />}
          View details
        </span>

        <Collapse isOpen={showErrors}>
          <div style={{ paddingLeft: 15 }}>
            {problems.map(x => (
              <div key={x.message} style={{ marginBottom: 10 }}>
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

export default inject(({ store }: { store: RootStore }) => ({
  store,
  editor: store.editor
}))(observer(FileStatus))
