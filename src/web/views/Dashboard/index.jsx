import React from 'react'
import {
  Panel,
  Grid,
  Row,
  Col,
  ControlLabel
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

  renderInformationSection() {
    return (
      <Row>
        <Col sm={12}>
          <Panel className={style.information}>
            <h3 className={style.informationName}>{this.state.information.name}</h3>
            <p className={style.informationDescription}>{this.state.information.description}</p>
            <p className={style.informationAuthor}>Created by <strong>{this.state.information.author}</strong> </p>
            <p className={style.informationVersion}>Version {this.state.information.version}</p>
            <p className={style.informationLicense}>Licensed under {this.state.information.license}</p>
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
