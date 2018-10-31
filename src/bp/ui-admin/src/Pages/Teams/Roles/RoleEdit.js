import React, { Component, Fragment } from 'react'
import { find } from 'lodash'

import { Row, Col, Button, FormGroup, Input, Modal, ModalHeader, ModalBody, ModalFooter } from 'reactstrap'
import Select from 'react-select'

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

const buildPermissionOptions = (permissions, acc = [], prefix = '') => {
  if (!permissions) {
    return acc
  }

  permissions.forEach(p => {
    // TODO: I wanted to build a hierarchy without the common parts,
    // like:
    // bot
    //   information
    //   information.license
    // but this didn't work as expected — can't make the leading spaces render
    if (p.operations && p.operations.length) {
      acc.push({
        label: p.name,
        value: p.name
      })
    }
    buildPermissionOptions(p.children, acc, prefix + '  ')
  })

  return acc
}

const emptyRole = {
  name: '',
  description: '',
  rules: []
}

const getDefaultPermissions = ruleInfo => (ruleInfo.operations ? `-${ruleInfo.operations.join('')}` : '')

const serializeRole = role => JSON.stringify(role)

export default class Role extends Component {
  state = {
    role: null,
    originalRole: null,
    roleHash: null,
    newRuleResource: null
  }

  static getDerivedStateFromProps(props, state) {
    let change = false
    const patch = {}

    if (props.createMode === true) {
      if (!state.role) {
        change = true
        Object.assign(patch, {
          originalRole: emptyRole,
          role: emptyRole,
          roleHash: serializeRole(emptyRole)
        })
      }
    } else if (props.createMode === false && props.role && props.role !== state.originalRole) {
      change = true
      Object.assign(patch, {
        originalRole: props.role,
        role: props.role,
        roleHash: serializeRole(props.role)
      })
    }

    if (props.existingPermissions && !state.existingPermissions) {
      change = true
      Object.assign(patch, {
        existingPermissions: props.existingPermissions,
        indexedPermissions: indexPermissions(props.existingPermissions),
        permissionOptions: buildPermissionOptions(props.existingPermissions)
      })
    }

    return change ? patch : null
  }

  onRuleOpChange = i => op => {
    this.setState(({ role }) => {
      const rules = [...role.rules]
      rules[i].op = op

      return {
        role: {
          ...this.state.role,
          rules
        }
      }
    })
  }

  onDescChange = event => {
    const { value } = event.target

    this.setState(({ role }) => {
      return {
        role: {
          ...role,
          description: value
        }
      }
    })
  }

  onNameChange = event => {
    const { value } = event.target

    this.setState(({ role }) => {
      return {
        role: {
          ...role,
          name: value
        }
      }
    })
  }

  isDirty() {
    return this.state.roleHash !== serializeRole(this.state.role)
  }

  canSave() {
    const isDirty = this.isDirty()

    if (!isDirty || this.props.readOnly) {
      return false
    }
    if (this.props.createMode && !this.state.role.name) {
      return false
    }
    return true
  }

  onRuleDelete = i => () => {
    this.setState(({ role }) => {
      const rules = [...role.rules]
      rules.splice(i, 1)

      return {
        role: {
          ...this.state.role,
          rules
        }
      }
    })
  }

  onRuleUp = i => () => {
    if (i < 1) {
      return
    }

    this.setState(({ role }) => {
      const rules = [...this.state.role.rules]
      const t = rules[i]
      rules[i] = rules[i - 1]
      rules[i - 1] = t

      return {
        role: {
          ...role,
          rules
        }
      }
    })
  }

  onRuleDown = i => () => {
    if (i > this.props.total - 2) {
      return
    }

    this.setState(({ role }) => {
      const rules = [...role.rules]
      const t = rules[i]
      rules[i] = rules[i + 1]
      rules[i + 1] = t

      return {
        role: {
          ...this.state.role,
          rules
        }
      }
    })
  }

  onRuleAdd = () => {
    if (!this.state.newRuleResource) {
      return
    }

    this.setState(({ role, newRuleResource, indexedPermissions }) => {
      const newRule = { res: newRuleResource, op: getDefaultPermissions(indexedPermissions[newRuleResource]) }
      const rules = [...role.rules, newRule]

      return {
        role: {
          ...role,
          rules
        },
        newRuleResource: null
      }
    })
  }

  onDelete = () => {
    if (window.confirm("Are you sure you want to delete this role? This can't be undone.")) {
      this.props.onDelete()
    }
  }

  onReset = () => {
    this.setState(({ originalRole }) => ({
      role: originalRole
    }))
  }

  onClose = () => {
    this.setState({
      role: null,
      originalRole: null,
      roleHash: null,
      newRuleResource: null
    })
    this.props.onClose && this.props.onClose()
  }

  onSave = () => {
    if (!this.canSave()) {
      return
    }

    this.props.onSave(this.state.role)
    this.setState({
      role: null,
      originalRole: null,
      roleHash: null,
      newRuleResource: null
    })
  }

  renderMenu() {
    if (this.props.readOnly) {
      return null
    }

    const isDirty = this.isDirty()

    const canSave = this.canSave()

    return (
      <Fragment>
        <Button onClick={this.onClose} outline>
          Cancel
        </Button>
        <Button onClick={this.onReset} outline disabled={!isDirty}>
          Reset changes
        </Button>
        <Button onClick={this.onSave} disabled={!canSave} color={canSave ? 'primary' : 'primary'}>
          {isDirty ? '' : ''}Save
        </Button>
      </Fragment>
    )
  }

  changeNewRule = ({ value }) => {
    this.setState({ newRuleResource: value })
  }

  renderAddRule() {
    if (!this.state.permissionOptions || this.props.readOnly) {
      return null
    }

    const options = this.state.permissionOptions.filter(({ value }) => !find(this.state.role.rules, { res: value }))

    return (
      <Row>
        <Col sm="9" md="10">
          <Select value={this.state.newRuleResource} onChange={this.changeNewRule} options={options} />
        </Col>
        <Col sm="3" md="2" className="text-right">
          <Button color="secondary" onClick={this.onRuleAdd}>
            Add
          </Button>
        </Col>
      </Row>
    )
  }

  render() {
    const { role, indexedPermissions } = this.state
    const { createMode, readOnly } = this.props
    if (!role) {
      return null
    }

    return (
      <Modal isOpen={this.props.show} toggle={this.props.onClose}>
        <ModalHeader toggle={this.props.onClose}>{createMode ? 'New Role' : role.name}</ModalHeader>
        <ModalBody>
          {createMode && (
            <FormGroup>
              <label>
                <strong>Role Title</strong>
              </label>
              <Input id="inputName" value={role.name || ''} onChange={this.onNameChange} />
            </FormGroup>
          )}

          <FormGroup>
            <label>
              <strong>Role Description</strong>
            </label>
            {!readOnly ? (
              <Input
                id="inputDescripton"
                // placeholder="Description"
                value={role.description || ''}
                onChange={this.onDescChange}
              />
            ) : (
              role.description || ''
            )}
          </FormGroup>

          <FormGroup>
            <label>
              <strong>Role Permissions</strong>
            </label>
            {this.renderAddRule()}
          </FormGroup>
          {role.rules.map((rule, i) => (
            <Rule
              index={i}
              total={role.rules.length}
              readOnly={readOnly}
              rule={rule}
              ruleInfo={(indexedPermissions && indexedPermissions[rule.res]) || {}}
              onMoveUp={this.onRuleUp(i)}
              onMoveDown={this.onRuleDown(i)}
              onDelete={this.onRuleDelete(i)}
              onChange={this.onRuleOpChange(i)}
              key={`${i}.${rule.res}.${rule.op}`}
            />
          ))}
        </ModalBody>
        <ModalFooter>{this.renderMenu()}</ModalFooter>
      </Modal>
    )
  }
}
