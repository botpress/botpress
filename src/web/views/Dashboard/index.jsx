import React from 'react'
import {
  Panel,
  Grid,
  Row,
  Col,
  ControlLabel,
  Link
} from 'react-bootstrap'
import ContentWrapper from '~/components/Layout/ContentWrapper'
import PageHeader from '~/components/Layout/PageHeader'
import ModulesComponent from '~/components/Modules'
import HeroComponent from '~/components/Hero'
import MiddlewaresComponent from '~/components/Middlewares'

import {connect} from 'nuclear-js-react-addons'
import getters from '~/stores/getters'
import actions from '~/actions'

import axios from 'axios'

const style = require('./style.scss')

@connect(props => ({botInformation: getters.botInformation}))
class DashboardView extends React.Component {

  static contextTypes = {
    router: React.PropTypes.object.isRequired
  }

  constructor(props, context) {
    super(props, context)
    this.state = { loading: true }

    this.queryHero = this.queryHero.bind(this)
    this.queryModulesPopular = this.queryModulesPopular.bind(this)
    this.queryFeaturedModules = this.queryFeaturedModules.bind(this)
  }

  componentDidMount() {
    this.queryHero()
    .then(this.queryModulesPopular)
    .then(this.queryFeaturedModules)
    .then(() => {
      this.setState({
        loading: false
      })
    })
  }

  queryHero() {
    return axios.get('/api/module/hero')
    .then((result) => {
      this.setState({
        hero: result.data
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

  openLicenseComponent() {
    actions.toggleLicenseModal()
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
        <Col sm={12} md={8}>
          <Panel className={style.information}>
            <h3 className={style.informationName}>{this.props.botInformation.get('name')}</h3>
            <p className={style.informationDescription}>{this.props.botInformation.get('description')}</p>
            <p className={style.informationAuthor}>Created by <strong>{this.props.botInformation.get('author')}</strong> </p>
            <p className={style.informationVersion}>Version {this.props.botInformation.get('version')}</p>
            <p className={style.informationLicense}>
              Licensed under {this.props.botInformation.get('license')} (
              <a href='#' onClick={this.openLicenseComponent}>Change</a>)
            </p>

          </Panel>
        </Col>
        <Col xs={12} sm={8} md={4} smOffset={2} mdOffset={0}>
          <Panel className={style.contribution}>
            <div className={style.raysAnim}>
              <div className={style.rays}></div>
            </div>
            <HeroComponent className={style.contributionContent} {...this.state.hero}/>
          </Panel>
        </Col>
      </Row>
    )
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
        <Grid fluid>
          {this.renderInformationAndContributionSection()}
          <Row>
          <Col sm={12} md={6}>
            <MiddlewaresComponent type="incoming"/>
            {this.renderPopularModules()}
          </Col>
          <Col sm={12} md={6}>
            <MiddlewaresComponent type="outgoing"/>
            {this.renderFeaturedModules()}
          </Col>
          </Row>
        </Grid>
      </ContentWrapper>
    )
  }
}

export default DashboardView
