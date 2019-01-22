import React, { Component } from 'react'
import { ListGroup, ListGroupItem, Collapse, Badge, Button, Media } from 'reactstrap'
import { bindActionCreators } from 'redux'
import { connect } from 'react-redux'
import { fetchUsers } from '../../reducers/user'
import { fetchRoles } from '../../reducers/roles'
import moment from 'moment'
import LoadingSection from '../Components/LoadingSection'
import _ from 'lodash'
import style from '../../scss/_userlist.scss'

class UserList extends Component {
  state = {
    needRefresh: false
  }

  componentDidMount() {
    this.props.fetchUsers()
    this.props.fetchRoles()
  }

  componentDidUpdate() {
    if (this.state.needRefresh) {
      this.props.fetchUsers()
      this.setState({ needRefresh: false })
    }
  }

  toggle(role) {
    this.setState({ [role]: !this.state[role] })
  }

  renderUsersForRole(users, roleId) {
    return (
      <Collapse isOpen={this.state[roleId]}>
        <ListGroup>
          {users.map(user => {
            return (
              <ListGroupItem key={'user-' + user.email}>
                <Media object src={user.picture || 'https://via.placeholder.com/64'} alt="" />
                <div className={style.userName}>
                  {user.firstname}
                  &nbsp;
                  {user.lastname}
                </div>
                <div>
                  <b>Email:</b>
                  &nbsp;
                  {user.email}
                </div>
                <div>
                  <b>Last Login:</b>
                  &nbsp;
                  {moment(user.last_logon).fromNow()}
                </div>
                <div>
                  <b>Joined:</b>
                  &nbsp;
                  {moment(user.created_on).fromNow()}
                </div>
                <div>
                  {this.props.actions.map((action, idx) => {
                    return (
                      <Button
                        color={action.type ? action.type : 'link'}
                        size="sm"
                        key={idx}
                        onClick={() => {
                          action.onClick(user)
                          if (action.needRefresh) {
                            this.setState({ needRefresh: true })
                          }
                        }}
                      >
                        {action.label}
                      </Button>
                    )
                  })}
                </div>
              </ListGroupItem>
            )
          })}
        </ListGroup>
      </Collapse>
    )
  }

  renderUsers() {
    return this.props.roles.map(role => {
      const users = this.props.users.filter(user => user.role === role.id)
      if (!users.length) {
        return null
      }

      return (
        <div key={'role-' + role.id}>
          <div onClick={() => this.toggle(role.id)}>
            {role.name}
            &nbsp;
            <Badge pill>{users.length}</Badge>
            <i
              className={
                this.state[role.id] ? 'glyphicon glyphicon-triangle-bottom' : 'glyphicon glyphicon-triangle-bottom'
              }
            />
          </div>
          {this.renderUsersForRole(users, role.id)}
        </div>
      )
    })
  }

  render() {
    const renderLoading = () => <LoadingSection />
    return !this.props.users || this.props.loading ? renderLoading() : this.renderUsers()
  }
}

const mapStateToProps = state => ({
  roles: state.roles.roles,
  users: state.user.items,
  loading: state.user.loadingUsers
})

const mapDispatchToProps = dispatch =>
  bindActionCreators(
    {
      fetchUsers,
      fetchRoles
    },
    dispatch
  )

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(UserList)
