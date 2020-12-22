import React, { Component } from 'react'
import { connect } from 'react-redux'
import { fetchRoles } from '../../reducers/roles'
import PageContainer from '~/App/PageContainer'
import { lang } from 'botpress/shared'

class Roles extends Component {
  componentDidMount() {
    !this.props.roles.length && this.props.fetchRoles()
  }

  renderRoles() {
    return (
      <div className="bp_table">
        {this.props.roles.map(role => {
          return (
            <div className="bp_table-row" key={role.id}>
              <div className="title">{lang.tr(role.name)}</div>
              <p>{lang.tr(role.description)}</p>
            </div>
          )
        })}
      </div>
    )
  }

  render() {
    return (
      <PageContainer title={lang.tr('admin.workspace.roles.title')} helpText={lang.tr('admin.workspace.rolesHelp')}>
        {this.renderRoles()}
      </PageContainer>
    )
  }
}

const mapStateToProps = state => ({
  roles: state.roles.roles
})

const mapDispatchToProps = {
  fetchRoles
}

export default connect(mapStateToProps, mapDispatchToProps)(Roles)
