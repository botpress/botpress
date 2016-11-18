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
    this.state = {
      loading: false,
      information: {}
    }
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

  renderInformation(label, value) {
    return (
      <Row>
        <Col sm={2}>
          {label}
        </Col>
        <Col sm={10}>
          {value}
        </Col>
      </Row>
    )
  }
  renderInformationSection() {
    return (
      <Row>
        <Col sm={12}>
          <Panel header='Information'>
            {this.renderInformation('Name', this.state.information.name)}
            {this.renderInformation('Description', this.state.information.description)}
            {this.renderInformation('Author', this.state.information.author)}
            {this.renderInformation('Version', this.state.information.version)}
            {this.renderInformation('License', this.state.information.license)}
          </Panel>
        </Col>
      </Row>
    )
  }

  renderModulesSection() {
    return (
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
    )
  }

  render() {
    return (
      <ContentWrapper>
        {PageHeader(<span> Dashboard</span>)}
        <Grid fluid>
          {this.renderInformationSection()}
          {this.renderModulesSection()}
        </Grid>
      </ContentWrapper>

    )
  }
}
