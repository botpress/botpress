import React, { Fragment } from 'react'
import classnames from 'classnames'
import { Treebeard, theme as defaultTheme, decorators as defaultDecorators } from 'react-treebeard'

import merge from 'lodash/merge'

import style from './style.scss'

const theme = merge({}, defaultTheme, {
  tree: {
    base: {
      color: 'black',
      backgroundColor: 'transparent',
      height: '100%'
    },
    node: {
      activeLink: {
        background: 'transparent',
        fontWeight: 'bold'
      },
      header: {
        base: {
          color: 'black'
        }
      }
    }
  }
})

class MyContainer extends defaultDecorators.Container {
  renderToggle() {
    // skip rendering it using react-velocity
    // instead we render it ourselves with proper use of the
    // node toggled state
    return null
  }
}

const getDecorators = ({ dirtyFlows, renderMenu }) => ({
  ...defaultDecorators,
  Container: MyContainer,
  Toggle: () => null,
  Header: props => {
    if (props.node.type === 'folder') {
      return (
        <Fragment>
          <i
            className={classnames('material-icons', style.toggle, {
              [style.toggleActive]: props.node.toggled
            })}
          >
            chevron_right
          </i>
          <i className="material-icons">{props.node.toggled ? 'folder_open' : 'folder'}</i>
          &nbsp;
          <defaultDecorators.Header {...props} />
        </Fragment>
      )
    }

    const { name } = props.node.data
    if (dirtyFlows.includes(name)) {
      props = {
        ...props,
        node: {
          ...props.node,
          name: `${props.node.name} *`
        }
      }
    }

    return (
      <Fragment>
        <i className="material-icons">description</i>
        &nbsp;
        <defaultDecorators.Header {...props} />
        {renderMenu && renderMenu(props.node)}
      </Fragment>
    )
  }
})

const Tree = props => {
  const { dirtyFlows, renderMenu, ...treeProps } = props
  const decorators = getDecorators({ dirtyFlows, renderMenu })
  return <Treebeard style={theme} decorators={decorators} {...treeProps} />
}

export default Tree
