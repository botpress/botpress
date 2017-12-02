import React from 'react'
import { connect } from 'react-redux'
import { bindActionCreators } from 'redux'
import { Grid, Row, Col, FormGroup, FormControl, Button } from 'react-bootstrap'

import _ from 'lodash'
import axios from 'axios'
import classnames from 'classnames'

import ContentWrapper from '~/components/Layout/ContentWrapper'
import PageHeader from '~/components/Layout/PageHeader'
import ModulesComponent from '~/components/Modules'
import { fetchModules } from '~/actions'

const style = require('./style.scss')

const DEFAULT_TAG = 'All'

class ManageView extends React.Component {
  constructor(props) {
    super(props)
    this.state = {
      modules: [],
      tags: [DEFAULT_TAG, 'Connector', 'Analytics', 'Marketing', 'NLP', 'Others'],
      tag: DEFAULT_TAG,
      search: '',
      loading: true
    }

    this.queryModules = this.queryModules.bind(this)
    this.renderTag = this.renderTag.bind(this)
  }

  componentDidMount() {
    this.queryModules()
  }

  queryModules() {
    this.setState({ loading: true })

    return axios.get('/api/module/all').then(result => {
      this.setState({
        modules: result.data,
        loading: false
      })
    })
  }

  refresh() {
    this.queryModules().then(() => {
      setTimeout(this.props.fetchModules, 5000)
    })
  }

  getResultFromSearch(modules) {
    const result = []

    modules.forEach(m => {
      const search = [m.name, m.description, m.author].join(' ').toLowerCase()

      if (_.includes(search, this.state.search)) {
        result.push(m)
      }
    })

    return result
  }

  getResultFromCategory(modules) {
    if (this.state.tag === DEFAULT_TAG) {
      return modules
    }

    return _.filter(modules, m => m.category === _.lowerCase(this.state.tag))
  }

  handleSearchChange(event) {
    this.setState({
      tag: DEFAULT_TAG,
      search: _.lowerCase(event.target.value)
    })
  }

  handleChangeCategory(event, label) {
    this.setState({
      tag: label
    })
  }

  renderSearch() {
    const classNames = classnames(style.search, 'bp-search')

    return (
      <Row>
        <Col sm={12}>
          <FormGroup>
            <FormControl
              id="search"
              type="text"
              placeholder="Search"
              className={classNames}
              onChange={::this.handleSearchChange}
            />
          </FormGroup>
        </Col>
      </Row>
    )
  }

  renderTag(label) {
    const handleChange = event => {
      this.handleChangeCategory(event, label)
    }

    const classNames = classnames({
      ['bp-button']: true,
      [style.tag]: true,
      ['bp-button-tag']: true,
      ['bp-button-default']: label !== this.state.tag
    })

    return (
      <Button key={label} className={classNames} onClick={handleChange}>
        {label}
      </Button>
    )
  }

  renderTags() {
    return (
      <Row>
        <Col sm={12} className={style.tags}>
          {this.state.tags.map(this.renderTag)}
        </Col>
      </Row>
    )
  }

  renderModules() {
    let modules = this.state.modules

    if (this.state.search && this.state.search !== '') {
      modules = this.getResultFromSearch(modules)
    }

    modules = this.getResultFromCategory(modules)

    const splitOn = _.floor((_.size(modules) + 1) / 2)
    const [first, second] = _.chunk(modules, splitOn)

    return (
      <Row>
        <Col sm={6}>
          <ModulesComponent modules={first} refresh={this.refresh.bind(this)} />
        </Col>
        <Col sm={6}>
          <ModulesComponent modules={second} refresh={this.refresh.bind(this)} />
        </Col>
      </Row>
    )
  }

  render() {
    if (this.state.loading) {
      return null
    }

    return (
      <ContentWrapper>
        <PageHeader>
          <span> Modules</span>
        </PageHeader>
        <Grid fluid>
          <Row>
            <Col sm={12} md={10} mdOffset={1}>
              {this.renderSearch()}
              {this.renderTags()}
              {this.renderModules()}
            </Col>
          </Row>
        </Grid>
      </ContentWrapper>
    )
  }
}

const mapDispatchToProps = dispatch => bindActionCreators({ fetchModules }, dispatch)

export default connect(null, mapDispatchToProps)(ManageView)
