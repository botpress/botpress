import React from 'react'
import { connect } from 'react-redux'

import { Grid, Row, Col } from 'react-bootstrap'

import axios from 'axios'

import ContentWrapper from '~/components/Layout/ContentWrapper'
import PageHeader from '~/components/Layout/PageHeader'
import InformationComponent from '~/components/Information'
import HeroComponent from '~/components/Hero'

class Dashboard extends React.Component {
  state = {
    loading: true,
    popularModules: [],
    featuredModules: [],
    hiddenHeroSection: true
  }

  initialized = false

  init() {
    if (this.initialized || !this.props.user || this.props.user.id == null) {
      return
    }

    this.initialized = true
    this.setState({ loading: false })
  }

  componentDidMount() {
    this.init()
    this.fetchHeroConfig()
  }

  componentDidUpdate() {
    this.init()
  }

  fetchHeroConfig() {
    axios
      .get('/api/community/hero')
      .then(({ data: { hidden: hiddenHeroSection } }) => this.setState({ hiddenHeroSection }))
  }

  hero() {
    const { hiddenHeroSection } = this.state

    return !hiddenHeroSection ? (
      <Col xs={12} sm={8} md={4} smOffset={2} mdOffset={0}>
        <HeroComponent />
      </Col>
    ) : null
  }

  render() {
    const { hiddenHeroSection, loading } = this.state

    if (loading || !this.initialized) {
      return null
    }

    return (
      <ContentWrapper>
        <PageHeader>
          <span> Dashboard</span>
        </PageHeader>
        <Grid fluid className={'bp-dashboard'}>
          <Row>
            <Col sm={12} md={hiddenHeroSection ? 12 : 8}>
              <InformationComponent />
            </Col>
            {this.hero()}
          </Row>
        </Grid>
      </ContentWrapper>
    )
  }
}

const mapStateToProps = state => ({
  user: state.user
})

export default connect(mapStateToProps)(Dashboard)
