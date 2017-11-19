import React from 'react'
import { bindActionCreators } from 'redux'
import { connect } from 'react-redux'
import { Panel, Grid, Row, Col } from 'react-bootstrap'

import axios from 'axios'
import _ from 'lodash'

import ContentWrapper from '~/components/Layout/ContentWrapper'
import PageHeader from '~/components/Layout/PageHeader'
import ModulesComponent from '~/components/Modules'
import InformationRowComponent from '+/views/Information'
import { fetchModules } from '~/actions'

class DashboardView extends React.Component {
  constructor(props, context) {
    super(props, context)

    this.state = { loading: true }

    this.queryAllModules = this.queryAllModules.bind(this)
  }

  componentDidMount() {
    this.queryAllModules().then(() => {
      this.setState({
        loading: false
      })
    })
  }

  queryAllModules() {
    return axios.get('/api/module/all').then(result => {
      this.setState({
        popularModules: _.filter(result.data, m => m.popular),
        featuredModules: _.filter(result.data, m => m.featured)
      })
    })
  }

  refresh() {
    this.queryAllModules().then(() => setTimeout(this.props.fetchModules, 5000))
  }

  renderPopularModules() {
    return (
      <Panel header="Popular modules">
        <ModulesComponent modules={this.state.popularModules} refresh={this.refresh.bind(this)} />
      </Panel>
    )
  }

  renderFeaturedModules() {
    return (
      <Panel header="Featured modules">
        <ModulesComponent modules={this.state.featuredModules} refresh={this.refresh.bind(this)} />
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
          <InformationRowComponent />
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

const mapDispatchToProps = dispatch => bindActionCreators({ fetchModules }, dispatch)

export default connect(null, mapDispatchToProps)(DashboardView)
