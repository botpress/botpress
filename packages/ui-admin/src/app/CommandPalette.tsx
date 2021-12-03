import { Commander, lang, QuickShortcut } from 'botpress/shared'
import React, { useEffect, useState, FC } from 'react'
import { connect, ConnectedProps } from 'react-redux'
import { RouteComponentProps, withRouter } from 'react-router'

import { fetchBots } from '~/workspace/bots/reducer'
import { AppState } from './rootReducer'

type Props = ConnectedProps<typeof connector> & RouteComponentProps

const CommandPalette: FC<Props> = props => {
  const [commands, setCommands] = useState<QuickShortcut[]>([])

  useEffect(() => {
    if (!props.bots) {
      props.fetchBots()
    }

    if (!props.workspaces || !props.bots) {
      return
    }

    const getBotDisplayName = bot => {
      return props.bots.filter(x => x.name === bot.name).length > 1 ? `${bot.name} (${bot.id})` : bot.name
    }

    const commands: QuickShortcut[] = props.bots.map(bot => ({
      label: lang.tr('commander.viewBot', { name: getBotDisplayName(bot) }),
      category: 'studio',
      type: 'redirect',
      url: window.location.origin + '/studio/' + bot.id
    }))

    if (props.workspaces.length > 1) {
      for (const workspace of props.workspaces) {
        const urlPage = props.location.pathname.split('/')[3]
        commands.push({
          label: lang.tr('commander.switchWorkspace', { name: workspace.workspaceName }),
          category: 'admin',
          type: 'goto',
          url: `/workspace/${workspace.workspaceName}/${urlPage}`
        })
      }
    }

    setCommands(commands)
  }, [props.workspaces, props.bots])

  return <Commander location="admin" history={props.history} user={props.user} shortcuts={commands} />
}

const mapStateToProps = (state: AppState) => ({
  bots: state.bots.bots,
  user: state.user.profile,
  workspaces: state.user.workspaces
})

const connector = connect(mapStateToProps, { fetchBots })
export default withRouter(connector(CommandPalette))
