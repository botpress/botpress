import React, { Component } from 'react'
import { Row, Col } from 'reactstrap'

import SectionLayout from '../Layouts/Section'
import LoadingSection from '../Components/LoadingSection'
import ChangePassword from '../Components/ChangePassword'
import ProfileUpdate from '../Components/ProfileUpdate'

class Me extends Component {
  state = { loading: false }

  renderBody() {
    return (
      <Row className="profile">
        <Col sm="12" md="3">
          <div className="profile__avatar" />
          <ChangePassword />
        </Col>
        <Col sm="12" md="6">
          <ProfileUpdate />
        </Col>
      </Row>
    )
  }

  render() {
    const renderLoading = () => <LoadingSection />

    return (
      <SectionLayout
        title="Profile"
        activePage="profile"
        mainContent={this.state.loading ? renderLoading() : this.renderBody()}
      />
    )
  }
}

export default Me
