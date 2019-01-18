import React, { Component } from 'react'
import { connect } from 'react-redux'
import { Row, Col } from 'reactstrap'

import SectionLayout from '../Layouts/Section'
import LoadingSection from '../Components/LoadingSection'
import ChangePassword from '../Components/ChangePassword'
import ProfileUpdate from '../Components/ProfileUpdate'

class Me extends Component {
  state = { loading: false }

  renderBody = () => {
    return (
      this.props.profile && (
        <Row>
          <Col sm="12" md="3" className="profile">
            <img src={`${this.props.profile.picture}?size=200`} className="profile__picture" />
            <ChangePassword />
          </Col>
          <Col sm="12" md="6">
            <ProfileUpdate />
          </Col>
        </Row>
      )
    )
  }

  render() {
    const renderLoading = () => <LoadingSection />
    return (
      <SectionLayout
        title="My profile"
        activePage="profile"
        mainContent={this.state.loading ? renderLoading() : this.renderBody()}
      />
    )
  }
}

const mapStateToProps = state => ({
  profile: state.user.profile
})

export default connect(mapStateToProps)(Me)
