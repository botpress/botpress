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
    this.handleInstall = this.handleInstall.bind(this)
    this.handleUninstall = this.handleUninstall.bind(this)
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

  handleInstall(name) {
    console.log('install')
  }

  handleUninstall(name) {
    console.log('uninstall')
  }

  renderLeftSideModule(module) {
    return (
      <div>
        <div>
          <i className='icon material-icons'>{module.icon}</i>
          {module.name}
        </div>
        <div>{module.description}</div>
        <div>{module.author}</div>
        <div>{module.license}</div>
      </div>
    )
  }

  renderManageButton(module) {
    let buttonStyle = module.installed ? 'success' : 'danger'
    let text = module.installed ? 'Install' : 'Uninstall'
    let icon = module.installed ? 'add_circle' : 'remove_circle'
    let action = module.installed ? this.handleInstall : this.handleUninstall

    return (
      <Button bsStyle={buttonStyle} onClick={action}>
        <i className='icon material-icons'>{icon}</i>
        {text}
      </Button>
    )
  }

  renderRightSideModule(module) {
    return (
      <div>
        <div>
          <i className='icon material-icons'>star_rate</i>
          {module.stars}
        </div>
        <div>
          <i className='icon material-icons'>cloud_download</i>
          {module.downloads}
        </div>
        <div>
          {this.renderManageButton(module)}
        </div>
      </div>
    )
  }

  renderModule(module) {
    return (
      <Panel key={module.name} className={style.module}>
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
