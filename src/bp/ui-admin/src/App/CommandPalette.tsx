import { Commander, lang, QuickShortcut } from 'botpress/shared'
import React, { useEffect, useState } from 'react'
import { connect } from 'react-redux'
import { withRouter } from 'react-router'

import { fetchBots } from '../reducers/bots'

const CommandPalette = props => {
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

const mapStateToProps = state => ({
  bots: state.bots.bots,
  user: state.user.profile,
  workspaces: state.user.workspaces
})

const mapDispatchToProps = { fetchBots }

export default connect(mapStateToProps, mapDispatchToProps)(withRouter(CommandPalette))
