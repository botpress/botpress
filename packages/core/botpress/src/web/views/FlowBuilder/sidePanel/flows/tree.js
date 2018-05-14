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

const getDecorators = ({ dirtyFlows }) => ({
  ...defaultDecorators,
  Toggle: ({ width, height }) => {
    return <i className={classnames('material-icons', style.toggle)}>chevron_right</i>
  },
  Header: props => {
    if (props.node.type === 'folder') {
      return (
        <Fragment>
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
      </Fragment>
    )
  }
})

const Tree = props => {
  const { dirtyFlows, ...treeProps } = props
  const decorators = getDecorators({ dirtyFlows })
  return <Treebeard style={theme} decorators={decorators} {...treeProps} />
}

export default Tree
