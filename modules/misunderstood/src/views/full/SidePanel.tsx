import React from 'react'

import style from './style.scss'
import LanguageSwitch from './LanguageSwitch'

const SidePanel = ({ languages, language, setLanguage, eventCounts, selectedStatus, events, selectedEventIndex }) => (
  <>
    <div className={style.sidePanelContent}>
      <LanguageSwitch languages={languages} language={language} onChage={setLanguage} />
    </div>
    <hr />
    <div className={style.sidePanelContent}>
      <pre>{JSON.stringify(eventCounts, null, 2)}</pre>
    </div>
  </>
)

export default SidePanel
