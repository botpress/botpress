import { Tab, Tabs } from '@blueprintjs/core'
import { lang } from 'botpress/shared'
import { inject, observer } from 'mobx-react'
import React, { useState } from 'react'
import { RootStore } from '../store'
import style from './style.scss'

const FileStatus = props => {
  const [tab, setTab] = useState<any>('problems')
  const problems = props.editor.fileProblems
  if (!problems || !problems.length) {
    return null
  }

  return (
    <Tabs className={style.tabs} onChange={tab => setTab(tab)} selectedTabId={tab}>
      <Tab
        id="problems"
        className={style.tab}
        title={`${lang.tr('problems')}${problems.length ? ` (${problems.length})` : ''}`}
        panel={
          <div>
            {problems.map((x, idx) => (
              <div key={`${idx}_${x.message.substr(0, 10)}`} style={{ marginBottom: 10 }}>
                {lang.tr('line')} <strong>{x.startLineNumber}</strong> - {x.message}
              </div>
            ))}
          </div>
        }
      />
    </Tabs>
  )
}

export default inject(({ store }: { store: RootStore }) => ({
  store,
  editor: store.editor
}))(observer(FileStatus))
