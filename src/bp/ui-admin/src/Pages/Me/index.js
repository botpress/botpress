import React, { Component } from 'react'

import SectionLayout from '../Layouts/Section'
import LoadingSection from '../Components/LoadingSection'

import { Row, Col } from 'reactstrap'
import displaySections from '../sections'

class Me extends Component {
  state = { loading: false }

  renderBody() {
    return (
      <Row className="profile">
        <Col sm="12" md="4">
          <div className="profile__avatar" />
        </Col>
        <Col sm="12" md="6">
          <div className="form-group">
            <label for="firstName">First Name</label>
            <input type="text" id="firstName" className="form-control" disabled />
          </div>
          <div className="form-group">
            <label for="lastName">Last Name</label>
            <input type="text" id="lastName" className="form-control" disabled />
          </div>
          <div className="form-group">
            <label for="username">Username</label>
            <input type="text" id="username" className="form-control" disabled />
          </div>
          <div className="form-group">
            <label for="email">Email</label>
            <input type="text" id="email" className="form-control" disabled />
          </div>
        </Col>
      </Row>
    )
  }

  render() {
    const renderLoading = () => <LoadingSection />

    return (
      <SectionLayout
        title="Profile"
        sections={displaySections('profile')}
        mainContent={this.state.loading ? renderLoading() : this.renderBody()}
      />
    )
  }
}

export default Me
