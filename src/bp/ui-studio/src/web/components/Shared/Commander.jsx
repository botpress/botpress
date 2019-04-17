import CommandPalette from 'react-command-palette'
import { connect } from 'react-redux'
import { bindActionCreators } from 'redux'
import { fetchContentCategories } from '~/actions'

class Commander extends React.Component {
  state = {}
  commands = []

  componentDidMount() {
    if (!this.props.contentTypes) {
      this.props.fetchContentCategories()
    }
  }

  componentDidUpdate(prevProps) {
    if (
      prevProps.modules !== this.props.modules ||
      prevProps.bots !== this.props.bots ||
      prevProps.contentTypes !== this.props.contentTypes
    ) {
      this.updateCommands()
    }
  }

  updateCommands() {
    if (!this.props.modules || !this.props.bots || !this.props.contentTypes) {
      return
    }

    this.commands = []

    this.addCommand({ name: 'Flow Editor', action: 'link', arg: '/flows/main' })
    this.addCommand({ name: 'Content Editor', action: 'link', arg: '/content' })
    this.addCommand({ name: 'Back to Admin', action: 'externalLink', arg: `${window.location.origin}/admin` })
    this.addCommand({ name: 'Documentation', action: 'openPopup', arg: `https://botpress.io/docs/introduction/` })

    this.addCommand({
      name: 'Open Webchat in popup',
      action: 'openPopup',
      arg: `${window.location.origin}/s/${window.BOT_ID}`
    })

    this.props.contentTypes.map(x =>
      this.addCommand({ name: `Create new ${x.title}`, action: 'link', arg: `/content/#${x.id}` })
    )

    this.props.modules.map(module => {
      if (!module.noInterface) {
        if (module.name !== 'nlu') {
          this.addCommand({ name: `${module.fullName}`, action: 'link', arg: `/modules/${module.name}` })
        } else {
          this.addCommand({
            name: `${module.fullName} - Intents`,
            action: 'link',
            arg: `/modules/${module.name}/Intents`
          })
          this.addCommand({
            name: `${module.fullName} - Entities`,
            action: 'link',
            arg: `/modules/${module.name}/Entities`
          })
        }
      }

      this.addCommand({ name: `${module.fullName} - Reload module`, runCmd: () => this.reloadModule(module.name) })

      if (module.shortcuts) {
        module.shortcuts.map(short => this.addCommand({ ...short, name: module.fullName + ' - ' + short.name }))
      }
    })

    this.props.bots.map(bot =>
      this.addCommand({
        name: `Switch to bot ${bot.name} (${bot.id})`,
        action: 'externalLink',
        arg: window.location.origin + '/studio/' + bot.id
      })
    )

    this.setState({ commands: this.commands })
  }

  reloadModule(moduleName) {
    alert('RELOADING ' + moduleName)
  }

  addCommand({ name, action, arg }) {
    this.commands.push({
      name,
      command: () => {
        if (action === 'link') {
          this.props.history.push(arg)
        } else if (action === 'externalLink') {
          window.location = arg
        } else if (action === 'openPopup') {
          window.open(arg)
        } else if (action === 'runCmd' && _.isFunction(arg)) {
          arg()
        } else {
          console.log('not supported')
        }
      }
    })
  }

  addCommand22({ name, link, externalLink, openPopup, runCmd }) {
    this.commands.push({
      name,
      command: () => {
        if (link) {
          this.props.history.push(link)
        } else if (externalLink) {
          window.location = externalLink
        } else if (openPopup) {
          window.open(openPopup)
        } else if (runCmd && _.isFunction(runCmd)) {
          runCmd()
        } else {
          console.log('not supported')
        }
      }
    })
  }

  render() {
    if (!this.state.commands) {
      return null
    }

    const options = {
      key: 'name',
      keys: ['name'],
      threshold: -2000,
      limit: 7,
      allowTypo: true
    }

    return (
      <CommandPalette
        hotKeys={'ctrl+shift+p'}
        maxDisplayed={15}
        commands={this.state.commands}
        trigger={<span />}
        closeOnSelect={true}
        options={options}
      />
    )
  }
}
const mapStateToProps = state => ({
  modules: state.modules,
  bots: state.bots.bots,
  contentTypes: state.content.categories
})

const mapDispatchToProps = dispatch => bindActionCreators({ fetchContentCategories }, dispatch)

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(Commander)
