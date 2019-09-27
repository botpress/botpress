import React from 'react'

import LanguageSwitch from './LanguageSwitch'

const SidePanel = ({ languages }) => (
  <>
    <LanguageSwitch languages={languages} />
    <hr />
  </>
)

export default SidePanel
