import React from 'react'
import {
  Panel,
  Grid,
  Row,
  Col
} from 'react-bootstrap'
import ContentWrapper from '~/components/Layout/ContentWrapper'
import PageHeader from '~/components/Layout/PageHeader'
import ModulesComponent from '~/components/Modules'

import axios from 'axios'

const style = require('./style.scss')

export default class DashboardView extends React.Component {
  constructor(props) {
    super(props)
    this.state = { loading: false }
  }

  componentDidMount() {
    this.queryInformation()
    this.queryModulesPopular()
    this.queryFeaturedModules()
  }

  queryInformation() {
    axios.get('/api/manager/information')
    .then((result) => {
      this.setState({
        information: result.data
      })
    })
  }

  queryModulesPopular() {
    axios.get('/api/manager/modules/popular')
    .then((result) => {
      this.setState({
        popularModules: result.data
      })
    })
  }

  queryFeaturedModules() {
    axios.get('/api/manager/modules/featured')
    .then((result) => {
      this.setState({
        featuredModules: result.data
      })
    })
  }


  renderInformationSection() {
    return (
      <Panel header='Information'>
      </Panel>
    )
  }
  renderModulesSection() {
    return (
      <Grid fluid>
        <Row>
          <Col sm={6}>
            <Panel header='Popular modules'>
              <ModulesComponent modules={this.state.popularModules} />
            </Panel>
          </Col>
          <Col sm={6}>
            <Panel header='Featured modules'>
              <ModulesComponent modules={this.state.featuredModules} />
            </Panel>
          </Col>
        </Row>
      </Grid>
    )
  }

  render() {
    return (
      <ContentWrapper>
        {PageHeader(<span> Dashboard</span>)}
        {this.renderInformationSection()}
        {this.renderModulesSection()}
      </ContentWrapper>
    )
  }
}
