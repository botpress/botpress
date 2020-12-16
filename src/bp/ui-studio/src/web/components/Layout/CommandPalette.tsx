import { Commander, lang, QuickShortcut } from 'botpress/shared'
import React, { FC, useEffect, useState } from 'react'
import { connect } from 'react-redux'
import { RouteComponentProps, withRouter } from 'react-router'
import { fetchBotIds, fetchContentCategories, toggleBottomPanel } from '~/actions'
import { RootReducer } from '~/reducers'

type StateProps = ReturnType<typeof mapStateToProps>
type DispatchProps = typeof mapDispatchToProps

type Props = DispatchProps &
  StateProps &
  RouteComponentProps & {
    toggleEmulator: () => void
  }

const CommandPalette: FC<Props> = props => {
  const [commands, setCommands] = useState<QuickShortcut[]>([])

  useEffect(() => {
    if (!props.bots) {
      props.fetchBotIds()
    }

    if (!props.modules || !props.bots) {
      return
    }

    const getBotDisplayName = bot => {
      return props.bots.filter(x => x.name === bot.name).length > 1 ? `${bot.name} (${bot.id})` : bot.name
    }

    const commands: QuickShortcut[] = [
      {
        label: lang.tr('flows'),
        type: 'goto',
        category: 'studio',
        url: `/${window.USE_ONEFLOW ? 'flows' : 'flows/main'}`
      },
      { label: lang.tr('content'), type: 'goto', category: 'studio', url: '/content' },
      {
        label: lang.tr('commander.backToAdmin'),
        type: 'redirect',
        category: 'admin',
        url: `${window.location.origin}/admin`
      },
      {
        label: lang.tr('commander.links.chat'),
        category: 'external',
        type: 'popup',
        url: `${window.location.origin}/s/${window.BOT_ID}`
      },
      {
        label: lang.tr('toolbar.toggleBottomPanel'),
        category: 'command',
        shortcut: 'ctrl+j',
        type: 'execute',
        method: props.toggleBottomPanel
      },
      {
        label: lang.tr('toolbar.toggleEmulator'),
        category: 'command',
        shortcut: 'ctrl+e',
        type: 'execute',
        method: props.toggleEmulator
      },
      {
        label: lang.tr('toolbar.toggleSidePanel'),
        category: 'command',
        shortcut: 'ctrl+b',
        type: 'execute',
        method: () => window.toggleSidePanel()
      },
      ...props.bots.map(bot => ({
        label: lang.tr('commander.switchBot', { name: getBotDisplayName(bot) }),
        type: 'redirect' as any,
        category: 'studio',
        url: `${window.location.origin}/studio/${bot.id}`
      })),
      ...props.modules
        .filter(module => !module.noInterface)
        .map(module => ({
          label: `${lang.tr(`module.${module.name}.fullName`)}`,
          type: 'goto',
          category: 'module',
          url: `/modules/${module.name}`,
          permission: { resource: `module.${module.name}`, operation: 'write' }
        }))
    ]

    setCommands(commands)
  }, [props.modules, props.bots, props.contentTypes])

  return <Commander location="studio" history={props.history} user={props.user} shortcuts={commands} />
}

const mapStateToProps = (state: RootReducer) => ({
  modules: state.modules,
  bots: state.bots.bots,
  contentTypes: state.content.categories,
  user: state.user
})

const mapDispatchToProps = { fetchContentCategories, fetchBotIds, toggleBottomPanel }

export default connect(mapStateToProps, mapDispatchToProps)(withRouter(CommandPalette))
