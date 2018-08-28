import React, { Component } from 'react'

import SectionLayout from '../Layouts/Section'
import LoadingSection from '../Components/LoadingSection'

class Me extends Component {
  state = { loading: false }

  renderBody() {
    return <section>TBD</section>
  }

  renderSideMenu() {
    return <p>TBD</p>
  }

  render() {
    const renderLoading = () => <LoadingSection />

    const sections = [
      { title: 'Teams', active: false, link: '/teams' },
      { title: 'Profile', active: true, link: '/me' }
    ]

    return (
      <SectionLayout
        title="Profile"
        sections={sections}
        mainContent={this.state.loading ? renderLoading() : this.renderBody()}
        sideMenu={this.renderSideMenu()}
      />
    )
  }
}

export default Me
