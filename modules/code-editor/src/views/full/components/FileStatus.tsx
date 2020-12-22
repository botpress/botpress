import { Collapse, Icon } from '@blueprintjs/core'
import { lang } from 'botpress/shared'
import { SidePanelSection } from 'botpress/ui'
import { inject, observer } from 'mobx-react'
import React, { useState } from 'react'

import { RootStore } from '../store'

const FileStatus = props => {
  const [showErrors, setErrorDisplayed] = useState(false)
  const actions = [
    { label: lang.tr('discard'), icon: <Icon icon="disable" />, onClick: props.editor.discardChanges },
    { label: lang.tr('save'), icon: <Icon icon="floppy-disk" />, onClick: props.editor.saveChanges }
  ]

  const problems = props.editor.fileProblems
  if (!problems || !problems.length) {
    return (
      <SidePanelSection label={lang.tr('module.code-editor.fileStatus.fileInformation')} actions={actions}>
        <React.Fragment />
      </SidePanelSection>
    )
  }

  return (
    <SidePanelSection label={lang.tr('module.code-editor.fileStatus.fileInformation')} actions={actions}>
      <div style={{ padding: 5 }}>
        <strong>{lang.tr('warning')}</strong>
        <p>{lang.tr('module.code-editor.fileStatus.thereAreErrors', { count: problems.length })}</p>
        <p>{lang.tr('module.code-editor.fileStatus.fixThem', { count: problems.length })}</p>

        <span onClick={() => setErrorDisplayed(!showErrors)} style={{ cursor: 'pointer' }}>
          {showErrors && <Icon icon="caret-down" />}
          {!showErrors && <Icon icon="caret-up" />}
          {lang.tr('module.code-editor.fileStatus.viewDetails')}
        </span>

        <Collapse isOpen={showErrors}>
          <div style={{ paddingLeft: 15 }}>
            {problems.map(x => (
              <div key={x.message} style={{ marginBottom: 10 }}>
                {lang.tr('line')} <strong>{x.startLineNumber}</strong>
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
