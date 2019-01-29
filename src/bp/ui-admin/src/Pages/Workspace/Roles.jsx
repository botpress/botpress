import React, { Component } from 'react'
import { connect } from 'react-redux'
import { fetchRoles } from '../../reducers/roles'
import SectionLayout from '../Layouts/Section'

class Roles extends Component {
  componentDidMount() {
    this.props.fetchRoles()
  }

  renderRoles() {
    return (
      <div className="bp_table">
        {this.props.roles.map(role => {
          return (
            <div className="bp_table-row" key={role.id}>
              <div className="title">{role.name}</div>
              <p>{role.description}</p>
            </div>
          )
        })}
      </div>
    )
  }

  render() {
    return (
      <SectionLayout
        title="Roles"
        helpText="To change roles, please see “roles” in the workspaces.json file."
        activePage="roles"
        currentTeam={this.props.team}
        mainContent={this.renderRoles()}
      />
    )
  }
}

const mapStateToProps = state => ({
  roles: state.roles.roles
})

const mapDispatchToProps = {
  fetchRoles
}

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(Roles)
