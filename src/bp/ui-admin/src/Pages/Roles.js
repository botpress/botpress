import React, { Component } from 'react'
import { connect } from 'react-redux'
import { fetchRoles } from '../reducers/roles'
import { Row, Col, ListGroup, ListGroupItem } from 'reactstrap'
import SectionLayout from './Layouts/Section'

class Roles extends Component {
  componentDidMount() {
    this.props.fetchRoles()
  }

  renderRoles() {
    return (
      <div>
        <Row>
          <Col xs={12} md={12}>
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

  render() {
    return (
      <SectionLayout
        title={`Contributor Roles`}
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
