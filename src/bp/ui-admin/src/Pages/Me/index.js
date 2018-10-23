import React, {Component, Fragment} from 'react'

import SectionLayout from '../Layouts/Section'
import LoadingSection from '../Components/LoadingSection'

import {
  Row,
  Col
} from 'reactstrap'

class Me extends Component {
  state = {loading: false}

  renderBody() {
    return (
      <Row className="profile">
        <Col sm="12" md="4">
          <div className="profile__avatar"></div>
        </Col>
        <Col sm="12" md="6">
          <div className="form-group">
            <label for="firstName">First Name</label>
            <input type="text" id="firstName" className="form-control" disabled/>
          </div>
          <div className="form-group">
            <label for="lastName">Last Name</label>
            <input type="text" id="lastName" className="form-control" disabled/>
          </div>
          <div className="form-group">
            <label for="username">Username</label>
            <input type="text" id="username" className="form-control" disabled/>
          </div>
          <div className="form-group">
            <label for="email">Email</label>
            <input type="text" id="email" className="form-control" disabled/>
          </div>
        </Col>
      </Row>
    )
  }

  render() {
    const renderLoading = () => <LoadingSection/>

    const sections = [
      {title: 'Teams', active: false, link: '/teams'},
      {title: 'Profile', active: true, link: '/me'}
    ]

    return (
      <SectionLayout
        title="Profile"
        sections={sections}
        mainContent={this.state.loading ? renderLoading() : this.renderBody()}
      />
    )
  }
}

export default Me
