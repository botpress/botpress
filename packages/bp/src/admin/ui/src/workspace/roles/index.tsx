import { lang } from 'botpress/shared'
import React, { Component } from 'react'
import { connect, ConnectedProps } from 'react-redux'
import PageContainer from '~/app/common/PageContainer'
import style from '~/app/common/table.scss'
import { AppState } from '~/app/rootReducer'
import { fetchRoles } from './reducer'

type Props = ConnectedProps<typeof connector>

class Roles extends Component<Props> {
  componentDidMount() {
    !this.props.roles.length && this.props.fetchRoles()
  }

  renderRoles() {
    return (
      <div className={style.table}>
        {this.props.roles.map(role => {
          return (
            <div className={style.tableRow} key={role.id}>
              <div className={style.title}>{lang.tr(role.name)}</div>
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

const mapStateToProps = (state: AppState) => ({ roles: state.roles.roles })
const connector = connect(mapStateToProps, { fetchRoles })

export default connector(Roles)
