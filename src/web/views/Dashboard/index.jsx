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
import HeroComponent from '~/components/Hero'
import MiddlewaresComponent from '~/components/Middlewares'

import actions from '~/actions'

import axios from 'axios'

const style = require('./style.scss')

export default class DashboardView extends React.Component {
  constructor(props) {
    super(props)
    this.state = {
      loading: false,
      information: {},
      contributor: {},
      middlewares: []
    }

    this.queryModulesPopular = this.queryModulesPopular.bind(this)
    this.queryFeaturedModules = this.queryFeaturedModules.bind(this)
    this.queryMiddlewares = this.queryMiddlewares.bind(this)
  }

  componentDidMount() {
    this.queryInformation()
    this.queryContributor()
    this.queryModulesPopular()
    this.queryFeaturedModules()
    this.queryMiddlewares()
  }

  queryInformation() {
    return axios.get('/api/manager/information')
    .then((result) => {
      this.setState({
        information: result.data
      })
    })
  }

  queryMiddlewares() {
    return axios.get('/api/middlewares')
    .then(result => {
      this.setState({
        middlewares: result.data
      })
    })
  }

  queryContributor() {
    axios.get('/api/manager/contributor')
    .then((result) => {
      this.setState({
        contributor: result.data
      })
    })
  }

  queryModulesPopular() {
    return axios.get('/api/manager/modules/popular')
    .then((result) => {
      this.setState({
        popularModules: result.data
      })
    })
  }

  queryFeaturedModules() {
    return axios.get('/api/manager/modules/featured')
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

  renderInformationAndContributionSection() {
    return (
      <Row>
        <Col sm={8}>
          <Panel className={style.information}>
            <h3 className={style.informationName}>{this.state.information.name}</h3>
            <p className={style.informationDescription}>{this.state.information.description}</p>
            <p className={style.informationAuthor}>Created by <strong>{this.state.information.author}</strong> </p>
            <p className={style.informationVersion}>Version {this.state.information.version}</p>
            <p>Licensed under {this.state.information.license}</p>
          </Panel>
        </Col>
        <Col sm={4}>
          <Panel className={style.contribution}>
            <div className={style.raysAnim}>
              <div className={style.rays}></div>
            </div>
            <HeroComponent className={style.contributionContent} {...this.state.information.hero}/>
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
              <ModulesComponent modules={this.state.popularModules} refresh={this.refresh.bind(this)}/>
            </Panel>
          </Col>
          <Col sm={6}>
            <Panel header='Featured modules'>
              <ModulesComponent modules={this.state.featuredModules} refresh={this.refresh.bind(this)}/>
            </Panel>
          </Col>
        </Row>
    )
  }

  renderMiddlewaresSection() {
    return (
      <Row>
        <Col sm={12}>
          <Panel header='Middlewares'>
            <MiddlewaresComponent middlewares={this.state.middlewares} />
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
          {this.renderInformationAndContributionSection()}
          {this.renderMiddlewaresSection()}
          {this.renderModulesSection()}
        </Grid>
      </ContentWrapper>
    )
  }
}
