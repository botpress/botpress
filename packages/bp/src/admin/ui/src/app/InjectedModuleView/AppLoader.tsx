import { lang } from 'botpress/shared'
import { ALL_BOTS } from 'common/utils'
import React, { useEffect, FC } from 'react'
import { connect, ConnectedProps } from 'react-redux'
import { RouteComponentProps } from 'react-router'

import { setWorkspaceAppBotId } from '~/workspace/bots/reducer'
import PageContainer from '../common/PageContainer'
import { AppState } from '../rootReducer'
import InjectedModuleView from '.'

type Props = ConnectedProps<typeof connector> & RouteComponentProps<{ botId?: string; appName: string }>

const AppLoader: FC<Props> = props => {
  const { appName } = props.match.params
  let { botId } = props.match.params
  botId = botId || ALL_BOTS

  useEffect(() => {
    props.setWorkspaceAppBotId(botId)
    window.BOT_ID = botId || ''

    return () => {
      props.setWorkspaceAppBotId(undefined)
    }
  }, [botId, props.translationsLoaded])

  const module = props.modules.find(x => x.name === appName)

  return (
    <PageContainer title={lang.tr(`module.${module?.name}.fullName`) || module?.fullName || appName} noWrapper>
      <InjectedModuleView
        moduleName={appName}
        extraProps={{ botId, contentLang: props.contentLang, userProfile: props.profile }}
      />
    </PageContainer>
  )
}

const mapStateToProps = (state: AppState) => ({
  contentLang: state.ui.contentLang,
  modules: state.modules.loadedModules,
  profile: state.user.profile,
  translationsLoaded: state.modules.translationsLoaded
})

const connector = connect(mapStateToProps, { setWorkspaceAppBotId })
export default connector(AppLoader)
