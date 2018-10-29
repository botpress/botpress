import React, { Component } from 'react'
import { bindActionCreators } from 'redux'
import { connect } from 'react-redux'
import { Table, Button } from 'reactstrap'
import { fetchUsers } from '../../modules/user'
import moment from 'moment'
import LoadingSection from '../Components/LoadingSection'

class UserList extends Component {
  state = { needRefresh: false }

  componentDidMount() {
    this.props.fetchUsers()
  }

  componentDidUpdate() {
    if (this.state.needRefresh) {
      this.props.fetchUsers()
      this.setState({ needRefresh: false })
    }
  }

  renderUsers() {
    const isDetailed = this.props.detailed === 'true' ? {} : { display: 'none' }

    return (
      <div className="users">
        <Table>
          <thead>
            <tr>
              <th>Username</th>
              <th style={isDetailed} />
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {this.props.users &&
              this.props.users.map(user => {
                if (this.props.ignoreUsers && this.props.ignoreUsers.indexOf(user.id) !== -1) {
                  return null
                }

                return (
                  <tr key={user.id}>
                    <td>
                      {user.firstname} {user.lastname}
                      <br />
                      <small>{user.username}</small>
                    </td>
                    <td style={isDetailed}>
                      <small>
                        Created at: {moment(user.created_at).format('LLLL')}
                        <br />
                        Last Logon: {user.last_logon ? moment(user.last_logon).fromNow() : 'never'}
                      </small>
                    </td>
                    <td>
                      {this.props.actions.map((action, idx) => {
                        return (
                          <Button
                            color={action.type ? action.type : 'primary'}
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
                    </td>
                  </tr>
                )
              })}
          </tbody>
        </Table>
      </div>
    )
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
