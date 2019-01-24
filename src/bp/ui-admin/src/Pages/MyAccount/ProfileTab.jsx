import React, { Component } from 'react'
import { connect } from 'react-redux'
import { Row, Col, Container } from 'reactstrap'

import LoadingSection from '../Components/LoadingSection'
import ChangePassword from '../Components/ChangePassword'
import ProfileUpdate from '../Components/ProfileUpdate'
import GravatarImage from '../Components/GravatarImage'

class Me extends Component {
  state = { loading: false }

  renderBody = () => {
    return (
      this.props.profile && (
        <Container>
          <Row>
            <Col sm="12" md="3" className="profile">
              <GravatarImage email={this.props.profile.email} size="lg" className="profile__picture" />
              <p>
                We use <a href="https://gravatar.com">gravatar</a> to display profile pictures
              </p>
              <ChangePassword />
            </Col>
            <Col sm="12" md="6">
              <ProfileUpdate />
            </Col>
          </Row>
        </Container>
      )
    )
  }

  render() {
    const renderLoading = () => <LoadingSection />
    return this.state.loading ? renderLoading() : this.renderBody()
  }
}

const mapStateToProps = state => ({
  profile: state.user.profile
})

export default connect(mapStateToProps)(Me)
