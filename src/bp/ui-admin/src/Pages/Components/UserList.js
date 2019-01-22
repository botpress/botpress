import React, { Component, Fragment } from 'react'
import { ListGroup, ListGroupItem, Row, Col, ListGroupItemHeading, Collapse, Badge, Button, Media } from 'reactstrap'
import { bindActionCreators } from 'redux'
import { connect } from 'react-redux'
import { fetchUsers } from '../../reducers/user'
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

  renderUsersByRole(users, role) {
    return (
      <Collapse isOpen={this.state[role]}>
        <ListGroup>
          {users.map(user => {
            return (
              <ListGroupItem key={'user-' + user.email}>
                <Media object src={user.picture || 'https://via.placeholder.com/64'} alt="Generic placeholder image" />
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
                  <b>Last login:</b>
                  &nbsp;
                  {moment(user.last_logon).fromNow()}
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
    const roles = this.props.users.map(u => u.role)

    return roles.map(role => {
      const users = this.props.users.filter(user => user.role === role)
      return (
        <div key={'role-' + role}>
          <h2 onClick={() => this.toggle(role)}>
            {role}
            <Badge pill>{users.length}</Badge>
            <i
              className={
                this.state[role] ? 'glyphicon glyphicon-triangle-bottom' : 'glyphicon glyphicon-triangle-bottom'
              }
            />
          </h2>
          {this.renderUsersByRole(users, role)}
        </div>
      )
    })

    // return (
    //   <div className="users">
    //     <Table className="table bp-table">
    //       <thead>
    //         <tr>
    //           <th>Email</th>
    //           <th>Name</th>
    //           <th style={isDetailed}>Created at</th>
    //           <th style={isDetailed}>Last Logon</th>
    //           <th>Actions</th>
    //         </tr>
    //       </thead>
    //       <tbody>
    //         {this.props.users &&
    //           this.props.users.map(user => {
    //             if (this.props.ignoreUsers && this.props.ignoreUsers.indexOf(user.id) !== -1) {
    //               return null
    //             }

    //             return (
    //               <tr key={user.id}>
    //                 <td>{user.email}</td>
    //                 <td className="table-cell--ellipsis">
    //                   {user.firstname}
    //                   &nbsp;
    //                   {user.lastname}
    //                 </td>
    //                 <td style={isDetailed}>{moment(user.created_at).format('lll')}</td>
    //                 <td style={isDetailed}>{user.last_logon ? moment(user.last_logon).fromNow() : 'never'}</td>
    //                 <td>
    //                   {this.props.actions.map((action, idx) => {
    //                     return (
    //                       <Button
    //                         color={action.type ? action.type : 'link'}
    //                         size="sm"
    //                         key={idx}
    //                         onClick={() => {
    //                           action.onClick(user)

    //                           if (action.needRefresh) {
    //                             this.setState({ needRefresh: true })
    //                           }
    //                         }}
    //                       >
    //                         {action.label}
    //                       </Button>
    //                     )
    //                   })}
    //                 </td>
    //               </tr>
    //             )
    //           })}
    //       </tbody>
    //     </Table>
    //   </div>
    // )
  }

  render() {
    const renderLoading = () => <LoadingSection />
    return !this.props.users || this.props.loading ? renderLoading() : this.renderUsers()
  }
}

const mapStateToProps = state => ({
  users: state.user.items,
  loading: state.user.loadingUsers
})

const mapDispatchToProps = dispatch =>
  bindActionCreators(
    {
      fetchUsers
    },
    dispatch
  )

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(UserList)
