import React from 'react'

import style from './style.scss'
import LanguageSwitch from './LanguageSwitch'

const SidePanel = ({ languages, language }) => (
  <>
    <div className={style.sidePanelContent}>
      <LanguageSwitch languages={languages} language={language} onChage={console.log} />
    </div>
    <hr />
  </>
)

export default SidePanel
