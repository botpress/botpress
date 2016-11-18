import React from 'react'

import ContentWrapper from '~/components/Layout/ContentWrapper'
import PageHeader from '~/components/Layout/PageHeader'
import {
  Panel,
  Button,
  Grid,
  Row,
  Col
} from 'react-bootstrap'
import axios from 'axios'
import _ from 'lodash'

const style = require('./style.scss')

export default class ManageView extends React.Component {
  constructor(props, context) {
    super(props, context)
    this.state = { modules : [] }

    this.renderModule = this.renderModule.bind(this)
  }

  componentDidMount() {
    this.queryLogs()
  }

  queryLogs() {
    axios.get('/api/manager/modules')
    .then((result) => {
      this.setState({
        modules: result.data
      })
    })
  }

  renderLeftSideModule(module) {
    return (
      <div>
        <h3>
          <i className='icon material-icons'>{module.icon}</i>
          &nbsp;
          {module.name}
        </h3>
        <p>{module.description}</p>
        <p>{module.author}</p>
        <p>{module.license}</p>
      </div>
    )
  }

  renderRightSideModule(module) {
    return (
      <div>
        <h4>
          <i className='icon material-icons'>star rate</i>
          &nbsp;
          {module.stars}
        </h4>
        <Button bsStyle='success'>
          <i className='icon material-icons'>add</i>
          &nbsp; Install
        </Button>
      </div>
    )
  }

  renderModule(module) {
    return (
      <Panel className={style.module}>
        <Grid fluid>
          <Row>
            <Col sm={8}>
              {this.renderLeftSideModule(module)}
            </Col>
            <Col sm={4}>
              {this.renderRightSideModule(module)}
            </Col>
          </Row>
        </Grid>
      </Panel>
    )
  }

  renderModules() {
    return (
      <Panel header='Official list of modules'>
          {_.values(_.map(this.state.modules, this.renderModule))}
      </Panel>
    )
  }

  render() {
    return (
      <ContentWrapper>
        {PageHeader(<span> Manage modules</span>)}
        {this.renderModules()}
      </ContentWrapper>
    )
  }
}
