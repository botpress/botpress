import React from 'react'
import { connect } from 'react-redux'

import { Panel, Grid, Row, Col } from 'react-bootstrap'

import axios from 'axios'
import _ from 'lodash'

import ContentWrapper from '~/components/Layout/ContentWrapper'
import PermissionsChecker from '~/components/Layout/PermissionsChecker'
import PageHeader from '~/components/Layout/PageHeader'
import ModulesComponent from '~/components/Modules'
import InformationComponent from '~/components/Information'
import HeroComponent from '~/components/Hero'

class Dashboard extends React.Component {
  state = {
    loading: true,
    popularModules: [],
    featuredModules: []
  }

  componentDidMount() {
    this.queryAllModules().finally(() => this.setState({ loading: false }))
  }

  queryAllModules() {
    return axios.get('/api/module/all').then(result =>
      this.setState({
        popularModules: _.filter(result.data, m => m.popular),
        featuredModules: _.filter(result.data, m => m.featured)
      })
    )
  }

  refresh = () => this.queryAllModules()

  renderPopularModules() {
    return (
      <Panel>
        <Panel.Heading>Popular modules</Panel.Heading>
        <Panel.Body>
          <ModulesComponent modules={this.state.popularModules} refresh={this.refresh} />
        </Panel.Body>
      </Panel>
    )
  }

  renderFeaturedModules() {
    return (
      <Panel>
        <Panel.Heading>Featured modules</Panel.Heading>
        <Panel.Body>
          <ModulesComponent modules={this.state.featuredModules} refresh={this.refresh} />
        </Panel.Body>
      </Panel>
    )
  }

  render() {
    if (this.state.loading) {
      return null
    }
    return (
      <ContentWrapper>
        <PageHeader>
          <span> Dashboard</span>
        </PageHeader>
        <Grid fluid className={'bp-dashboard'}>
          <Row>
            <Col sm={12} md={8}>
              <InformationComponent />
            </Col>
            <Col xs={12} sm={8} md={4} smOffset={2} mdOffset={0}>
              <PermissionsChecker user={this.props.user} res="modules.list.community" op="red">
                <HeroComponent />
              </PermissionsChecker>
            </Col>
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
