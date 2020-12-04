import { EmptyState, lang, MainLayout } from 'botpress/shared'
import cx from 'classnames'
import React from 'react'

import style from '../../style.scss'
import AgentsIcon from '../../Icons/AgentsIcon'

export default () => (
  <div className={cx(style.column, style.emptyContainer)}>
    <MainLayout.Toolbar
      className={style.hitlToolBar}
      tabs={[{ id: 'conversation', title: lang.tr('module.hitlnext.conversation.tab') }]}
    />
    <EmptyState icon={<AgentsIcon />} text={lang.tr('module.hitlnext.conversation.empty')} />
  </div>
)
