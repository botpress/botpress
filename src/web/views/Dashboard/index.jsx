import React from 'react'
import {
  Panel,
  Grid,
  Row,
  Col,
  ControlLabel,
  Tooltip,
  OverlayTrigger,
  Link
} from 'react-bootstrap'

import classnames from 'classnames'
import axios from 'axios'

import ContentWrapper from '~/components/Layout/ContentWrapper'
import PageHeader from '~/components/Layout/PageHeader'
import ModulesComponent from '~/components/Modules'
import InformationRowComponent from '+/views/Information'

import actions from '~/actions'

const style = require('./style.scss')

export default class DashboardView extends React.Component {

  constructor(props, context) {
    super(props, context)
    
    this.state = { loading: true }

    this.queryModulesPopular = this.queryModulesPopular.bind(this)
    this.queryFeaturedModules = this.queryFeaturedModules.bind(this)
  }

  componentDidMount() {
    this.queryModulesPopular()
    .then(this.queryFeaturedModules)
    .then(() => {
      this.setState({
        loading: false
      })
    })
  }

  queryModulesPopular() {
    return axios.get('/api/module/popular')
    .then((result) => {
      this.setState({
        popularModules: result.data
      })
    })
  }

  queryFeaturedModules() {
    return axios.get('/api/module/featured')
    .then((result) => {
      this.setState({
        featuredModules: result.data
      })
    })
  }

  refresh() {
    this.queryFeaturedModules()
    .then(this.queryModulesPopular)
    .then(() => {
      setTimeout(actions.fetchModules, 5000)
    })
  }

  renderPopularModules() {
    return <Panel header='Popular modules'>
      <ModulesComponent modules={this.state.popularModules} refresh={this.refresh.bind(this)}/>
    </Panel>
  }

  renderFeaturedModules() {
    return <Panel header='Featured modules'>
      <ModulesComponent modules={this.state.featuredModules} refresh={this.refresh.bind(this)}/>
    </Panel>
  }

  render() {
    if (this.state.loading) {
      return null
    }
    return (
      <ContentWrapper>
        {PageHeader(<span> Dashboard</span>)}
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
