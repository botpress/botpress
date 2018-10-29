import React, { Component, Fragment } from 'react'

import { Button, ListGroupItem, ListGroupItemHeading } from 'reactstrap'

import Rule from './Rule'

const indexPermissions = (permissions, acc = {}) => {
  if (!permissions) {
    return acc
  }
  permissions.forEach(p => {
    acc[p.name] = p
    indexPermissions(p.children, acc)
  })
  return acc
}

export default class Role extends Component {
  state = {
    indexedPermissions: null
  }

  static getDerivedStateFromProps(props, state) {
    if (props.existingPermissions && !state.indexedPermissions) {
      return {
        indexedPermissions: indexPermissions(props.existingPermissions)
      }
    }

    return null
  }

  onDelete = () => {
    if (window.confirm("Are you sure you want to delete this role? This can't be undone.")) {
      this.props.onDelete()
    }
  }

  onEdit = () => {}

  renderMenu() {
    if (this.props.readOnly) {
      return null
    }

    const { role } = this.props

    const deleteItem =
      role.name === 'owner' ? (
        <Button
          className="text-muted disabled"
          color="link"
          title="You cannot remove the team owner role"
          onClick={() => alert('You cannot remove the team owner role.')}
        >
          Delete
        </Button>
      ) : (
        <Button key="remove" color="link" onClick={this.onDelete}>
          Delete
        </Button>
      )

    return (
      <div className="list-group-item__actions">
        <Button onClick={this.props.onEdit} color="link">
          Edit
        </Button>
        {deleteItem}
      </div>
    )
  }

  render() {
    const { role } = this.props
    if (!role) {
      return null
    }

    const { indexedPermissions } = this.state

    return (
      <ListGroupItem>
        <ListGroupItemHeading>{role.name}</ListGroupItemHeading>
        {this.renderMenu()}
        {role.description && <small>{role.description}</small>}
        {role.rules &&
          role.rules.length && (
            <Fragment>
              <p className="list-group-item__permissions">Role Permissions:</p>
              {role.rules.map((rule, i) => (
                <Rule
                  index={i}
                  total={role.rules.length}
                  readOnly={true}
                  rule={rule}
                  ruleInfo={(indexedPermissions && indexedPermissions[rule.res]) || {}}
                  key={`${i}.${rule.res}.${rule.op}`}
                />
              ))}
            </Fragment>
          )}
      </ListGroupItem>
    )
  }
}
