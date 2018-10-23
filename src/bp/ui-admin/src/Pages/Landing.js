import React, {Component, Fragment} from 'react'

import SectionLayout from '../Layouts/Section'
import LoadingSection from '../Components/LoadingSection'

import {
  Button
} from 'reactstrap'

class Landing extends Component {
  state = {loading: false}

  renderBody() {
    return (
        <div className="landing">
          <h3>Welcome to Botpress!</h3>
          <p>Let's start by creating your profile</p>
          <Button>Complete your profile</Button>
        </div>
    )
  }

  render() {
    const renderLoading = () => <LoadingSection/>

    return (
      <SectionLayout
        title="Landing"
        sections={sections}
        mainContent={this.state.loading ? renderLoading() : this.renderBody()}
      />
    )
  }
}

export default Landing
