import CommandPalette from 'react-command-palette'
import { connect } from 'react-redux'
import { bindActionCreators } from 'redux'
import axios from 'axios'
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

    this.addCommand({ name: 'Flow Editor', action: 'goto', arg: '/flows/main' })
    this.addCommand({ name: 'Content Editor', action: 'goto', arg: '/content' })
    this.addCommand({ name: 'Back to Admin', action: 'redirect', arg: `${window.location.origin}/admin` })
    this.addCommand({ name: 'Documentation', action: 'popup', arg: `https://botpress.io/docs/introduction/` })

    this.addCommand({
      name: 'Open Webchat in popup',
      action: 'popup',
      arg: `${window.location.origin}/s/${window.BOT_ID}`
    })

    this.props.contentTypes.map(x =>
      this.addCommand({ name: `Create new ${x.title}`, action: 'goto', arg: `/content/#${x.id}` })
    )

    this.props.modules.map(module => {
      if (!module.noInterface) {
        if (module.name !== 'nlu') {
          this.addCommand({ name: `${module.fullName}`, action: 'goto', arg: `/modules/${module.name}` })
        } else {
          this.addCommand({
            name: `${module.fullName} - Intents`,
            action: 'goto',
            arg: `/modules/${module.name}/Intents`
          })
          this.addCommand({
            name: `${module.fullName} - Entities`,
            action: 'goto',
            arg: `/modules/${module.name}/Entities`
          })
        }
      }

      this.addCommand({
        name: `${module.fullName} - Reload module`,
        action: 'execute',
        arg: () => this.reloadModule(module.name)
      })

      if (module.shortcuts) {
        module.shortcuts.map(short => this.addCommand({ ...short, name: module.fullName + ' - ' + short.name }))
      }
    })

    this.props.bots.map(bot =>
      this.addCommand({
        name: `Switch to bot ${bot.name} (${bot.id})`,
        action: 'redirect',
        arg: window.location.origin + '/studio/' + bot.id
      })
    )

    this.setState({ commands: this.commands })
  }

  async reloadModule(moduleName) {
    await axios.get(`${window.API_PATH}/modules/reload/${moduleName}`)
    window.location.href = window.location.href
  }

  addCommand({ name, action, arg }) {
    this.commands.push({
      name,
      command: () => {
        if (action === 'goto') {
          this.props.history.push(arg)
        } else if (action === 'redirect') {
          window.location = arg
        } else if (action === 'popup') {
          window.open(arg)
        } else if (action === 'execute' && _.isFunction(arg)) {
          arg()
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
      threshold: -2000, // because why not ? fuzzy thing, ajustment required
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
