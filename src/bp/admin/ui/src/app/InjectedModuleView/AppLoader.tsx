import React, { useEffect } from 'react'

import PageContainer from '../common/PageContainer'
import InjectedModuleView from '.'

export const AppLoader = props => {
  const { botId, appName } = props.match.params

  useEffect(() => {
    window.BOT_ID = botId
  }, [botId])

  return (
    <PageContainer title={`Bot - ${botId}`} noWrapper>
      <InjectedModuleView moduleName={appName} extraProps={{ botId, contentLang: 'en' }} />
    </PageContainer>
  )
}
