import React from 'react'

import style from './style.scss'
import LanguageSwitch from './LanguageSwitch'

const SidePanel = ({ languages, language, setLanguage }) => (
  <>
    <div className={style.sidePanelContent}>
      <LanguageSwitch languages={languages} language={language} onChage={setLanguage} />
    </div>
    <hr />
  </>
)

export default SidePanel
