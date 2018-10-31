import React, { Component } from 'react'

import { bindActionCreators } from 'redux'
import { connect } from 'react-redux'
import { checkRule } from '@botpress/util-roles'

import { Button, Col, ListGroup, Row } from 'reactstrap'
import { MdPersonAdd } from 'react-icons/lib/md'

import { pick } from 'lodash'

import { fetchTeamData, fetchExistingPermissions } from '../../../modules/teams'
import { fetchPermissions } from '../../../modules/user'

import SectionLayout from '../../Layouts/Section'
import LoadingSection from '../../Components/LoadingSection'

import api from '../../../api'

import Role from './RoleView'
import RoleEdit from './RoleEdit'

class Roles extends Component {
  state = {
    roleToEdit: null,
    createNewRole: false
  }

  renderLoading() {
    return <LoadingSection />
  }

  fetchRoles = () => {
    this.props.fetchTeamData(this.props.teamId, { roles: true })
  }

  componentDidMount() {
    this.fetchRoles()
    this.props.fetchExistingPermissions()
    this.props.fetchPermissions(this.props.teamId)
  }

  componentDidUpdate(prevProps) {
    if ((!this.props.roles && !this.props.loading) || prevProps.teamId !== this.props.teamId) {
      this.fetchRoles()
    }
    if (prevProps.teamId !== this.props.teamId) {
      this.props.fetchPermissions(this.props.teamId)
    }
  }

  currentUserHasPermission = (resource, operation) => {
    if (!this.props.currentUserPermissions) {
      return false
    }
    return checkRule(this.props.currentUserPermissions, operation, resource)
  }

  onRoleCreate = role => {
    role = pick(role, 'name', 'description', 'rules')
    return api
      .getSecured()
      .post(`/api/teams/${this.props.teamId}/roles`, role)
      .then(this.onRoleEditDone)
      .then(this.fetchRoles)
  }

  onRoleChange = role => {
    const id = role.id
    role = pick(role, 'name', 'description', 'rules')
    api
      .getSecured()
      .patch(`/api/teams/${this.props.teamId}/roles/${id}`, role)
      .then(this.onRoleEditDone)
      .then(this.fetchRoles)
  }

  onRoleEditStart = role => () => {
    this.setState({
      roleToEdit: role,
      createNewRole: false
    })
  }

  onRoleEditDone = () => {
    this.setState({
      roleToEdit: null,
      createNewRole: false
    })
  }

  onRoleCreateStart = () => {
    this.setState({
      roleToEdit: null,
      createNewRole: true
    })
  }

  onRoleDelete = id => () => {
    api
      .getSecured()
      .delete(`/api/teams/${this.props.teamId}/roles/${id}`)
      .then(this.fetchRoles)
  }

  renderBody() {
    const { roles, existingPermissions } = this.props
    const { roleToEdit, createNewRole } = this.state
    return (
      <Row>
        <Col xs={12} md={8}>
          <ListGroup>
            {roles.map(role => (
              <Role
                role={role}
                readOnly={role.name === 'owner'}
                existingPermissions={existingPermissions}
                onEdit={this.onRoleEditStart(role)}
                onDelete={this.onRoleDelete(role.id)}
                key={role.id}
              />
            ))}
            <RoleEdit
              show={!!roleToEdit || createNewRole}
              role={roleToEdit}
              createMode={createNewRole}
              existingPermissions={existingPermissions}
              onSave={createNewRole ? this.onRoleCreate : this.onRoleChange}
              onClose={this.onRoleEditDone}
            />
          </ListGroup>
        </Col>
      </Row>
    )
  }

  renderSideMenu() {
    if (!this.currentUserHasPermission('admin.team.roles', 'write')) {
      return null
    }

    return (
      <Button className="float-right" color="primary" size="sm" onClick={this.onRoleCreateStart}>
        <MdPersonAdd /> Add role
      </Button>
    )
  }

  render() {
    if (this.props.loading || !this.props.roles) {
      return this.renderLoading()
    }

    return (
      <SectionLayout
        title={`${this.props.team.name}'s roles`}
        helpText="Permissions lower in the list have higher precedence."
        activePage="roles"
        currentTeam={this.props.team}
        mainContent={this.renderBody()}
        sideMenu={this.renderSideMenu()}
      />
    )
  }
}

const mapStateToProps = state => ({
  roles: state.teams.roles,
  teamId: state.teams.teamId,
  team: state.teams.team,
  loading: state.teams.loadingTeam,
  existingPermissions: state.teams.permissions,
  currentUser: state.user.profile,
  currentUserPermissions: state.user.permissions[state.teams.teamId]
})

const mapDispatchToProps = dispatch =>
  bindActionCreators(
    {
      fetchTeamData,
      fetchPermissions,
      fetchExistingPermissions
    },
    dispatch
  )

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(Roles)
