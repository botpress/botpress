import React, { Component, Fragment } from 'react'

import {
  Button,
  ListGroupItem,
  ListGroupItemHeading,
  UncontrolledDropdown,
  DropdownItem,
  DropdownToggle,
  DropdownMenu
} from 'reactstrap'

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
        <DropdownItem
          className="text-muted disabled"
          title="You cannot remove the team owner role"
          onClick={() => alert('You cannot remove the team owner role.')}
        >
          Delete
        </DropdownItem>
      ) : (
        <DropdownItem key="remove" className="text-danger" onClick={this.onDelete}>
          Delete
        </DropdownItem>
      )

    return (
      <div className="float-right">
        <Button onClick={this.props.onEdit} size="sm" color="info" outline>
          Edit
        </Button>
        <UncontrolledDropdown tag="span">
          <DropdownToggle caret size="sm" color="link">
            More
          </DropdownToggle>
          <DropdownMenu>{deleteItem}</DropdownMenu>
        </UncontrolledDropdown>
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
        <ListGroupItemHeading className="header">
          {role.name}
          {this.renderMenu()}
        </ListGroupItemHeading>
        {role.description && <p style={{ marginTop: 15 }}>{role.description}</p>}
        {role.rules &&
          role.rules.length && (
            <Fragment>
              <strong>Role Permissions:</strong>
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
