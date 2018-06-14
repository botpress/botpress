import React from 'react'
import { connect } from 'react-redux'

import { Panel, Grid, Row, Col } from 'react-bootstrap'

import axios from 'axios'
import _ from 'lodash'
import Promise from 'bluebird'

import ContentWrapper from '~/components/Layout/ContentWrapper'
import PermissionsChecker, { operationAllowed } from '~/components/Layout/PermissionsChecker'
import PageHeader from '~/components/Layout/PageHeader'
import ModulesComponent from '~/components/Modules'
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
    this.queryAllModules().finally(() => this.setState({ loading: false }))
  }

  componentDidMount() {
    this.init()
    this.fetchHeroConfig()
  }

  componentDidUpdate() {
    this.init()
  }

  queryAllModules() {
    if (!operationAllowed({ user: this.props.user, op: 'read', res: 'bot.modules.list.community' })) {
      return Promise.resolve()
    }
    return axios.get('/api/module/all').then(result =>
      this.setState({
        popularModules: _.filter(result.data, m => m.popular),
        featuredModules: _.filter(result.data, m => m.featured)
      })
    )
  }

  fetchHeroConfig() {
    axios
      .get('/api/community/hero')
      .then(({ data: { hidden: hiddenHeroSection } }) => this.setState({ hiddenHeroSection }))
  }

  renderPopularModules() {
    return (
      <PermissionsChecker user={this.props.user} op="read" res="bot.modules.list.community">
        <Panel>
          <Panel.Heading>Popular modules</Panel.Heading>
          <Panel.Body>
            <ModulesComponent modules={this.state.popularModules} refresh={this.refresh} />
          </Panel.Body>
        </Panel>
      </PermissionsChecker>
    )
  }

  renderFeaturedModules() {
    return (
      <PermissionsChecker user={this.props.user} op="read" res="bot.modules.list.community">
        <Panel>
          <Panel.Heading>Featured modules</Panel.Heading>
          <Panel.Body>
            <ModulesComponent modules={this.state.featuredModules} refresh={this.refresh} />
          </Panel.Body>
        </Panel>
      </PermissionsChecker>
    )
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
          <Row>
            <Col sm={12} md={6}>
              {this.renderPopularModules()}
            </Col>
            <Col sm={12} md={6}>
              {this.renderFeaturedModules()}
            </Col>
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
