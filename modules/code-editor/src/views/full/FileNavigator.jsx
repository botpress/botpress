import merge from 'lodash/merge'
import { Treebeard, theme as defaultTheme, decorators as defaultDecorators } from 'react-treebeard'
import { GoTriangleRight } from 'react-icons/go'

import { buildTree } from './utils/tree'

const style = merge({}, defaultTheme, {
  tree: {
    base: {
      padding: '10px'
    },
    node: {
      activeLink: {
        fontWeight: 'bold'
      },
      toggle: {
        wrapper: {
          height: 10,
          margin: '-9px 0 0 -9px'
        },
        height: 10,
        width: 10
      }
    }
  }
})

const decorators = {
  ...defaultDecorators,
  Toggle: ({ style }) => {
    return (
      <div style={style.base}>
        <div style={{ ...style.wrapper, display: 'flex' }}>
          <GoTriangleRight />
        </div>
      </div>
    )
  }
}

export default class FileNavigator extends React.Component {
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
    if (this.state.cursor && this.state.cursor.fullPath != node.fullPath) {
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

    return (
      <Treebeard
        data={this.state.nodes}
        onToggle={this.handleToggle}
        animations={false}
        style={style}
        decorators={decorators}
      />
    )
  }
}
