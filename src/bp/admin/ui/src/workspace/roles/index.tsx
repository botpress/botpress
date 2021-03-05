import { lang } from 'botpress/shared'
import React, { Component } from 'react'
import { connect } from 'react-redux'
import PageContainer from '~/app/common/PageContainer'
import { AppState } from '~/app/reducer'
import { fetchRoles } from './reducer'

type StateProps = ReturnType<typeof mapStateToProps>
type DispatchProps = typeof mapDispatchToProps
type Props = DispatchProps & StateProps

class Roles extends Component<Props> {
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

const mapStateToProps = (state: AppState) => ({
  roles: state.roles.roles
})

const mapDispatchToProps: any = {
  fetchRoles
}

export default connect<StateProps, DispatchProps, undefined, AppState>(mapStateToProps, mapDispatchToProps)(Roles)
