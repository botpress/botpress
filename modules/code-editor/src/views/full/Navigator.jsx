import { Treebeard } from 'react-treebeard'
import { buildTree } from './utils/tree'

export default class Navigator extends React.Component {
  state = {
    files: undefined,
    nodes: []
  }

  componentDidMount() {
    this.refreshNodes()
  }

  componentDidUpdate(prevProps) {
    if (prevProps.files !== this.props.files && this.props.files) {
      this.refreshNodes()
    }
  }

  async refreshNodes() {
    if (!this.props.files) {
      return
    }

    const { actionsGlobal, actionsBot } = this.props.files

    const nodes = []

    if (actionsBot) {
      nodes.push({
        name: `${window.BOT_NAME} (bot)`,
        toggled: true,
        children: buildTree(this.props.files.actionsBot)
      })
    }

    if (actionsGlobal) {
      nodes.push({
        name: 'Global',
        toggled: true,
        children: buildTree(this.props.files.actionsGlobal)
      })
    }

    this.setState({ nodes })
  }

  handleToggle = (node, toggled) => {
    node.active = true
    if (this.state.cursor) {
      this.state.cursor.active = false
    }

    if (node.children) {
      node.toggled = toggled
    }

    this.setState({ cursor: node })
    node.data && this.props.onFileSelected && this.props.onFileSelected(node.data)
  }

  render() {
    if (!this.state.nodes) {
      return null
    }

    return <Treebeard data={this.state.nodes} onToggle={this.handleToggle} />
  }
}
