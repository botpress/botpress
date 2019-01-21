import React, { Component } from 'react'
import { connect } from 'react-redux'
import { fetchRoles } from '../reducers/roles'
import { Row, Col, ListGroup, ListGroupItem } from 'reactstrap'

class Roles extends Component {
  componentDidMount() {
    this.props.fetchRoles()
  }

  render() {
    return (
      <div>
        <Row>
          <Col xs={12} md={12}>
            <h1>Contributor Roles</h1>
            <ListGroup>
              {this.props.roles.map(r => {
                return (
                  <ListGroupItem key={'role-' + r.name}>
                    <h3>{r.name}</h3>
                    <p>{r.description}</p>
                  </ListGroupItem>
                )
              })}
            </ListGroup>
          </Col>
        </Row>
      </div>
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
