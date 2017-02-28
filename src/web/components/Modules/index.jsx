import React, {Component} from 'react'

import ContentWrapper from '~/components/Layout/ContentWrapper'
import PageHeader from '~/components/Layout/PageHeader'

import {
  Panel,
  Grid,
  Row,
  Col
} from 'react-bootstrap'

import Button from 'react-bootstrap-button-loader'
import classnames from 'classnames'

import _ from 'lodash'
import axios from 'axios'

const style = require('./style.scss')

const numberWithCommas = (x) => {
  return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",")
}

class ModuleComponent extends Component {

  constructor(props) {
    super(props)

    this.state = { loading: false }

    this.handleInstall = this.handleInstall.bind(this)
    this.handleUninstall = this.handleUninstall.bind(this)
  }

  handleInstall() {
    const fin = () => {
      this.setState({ loading: false })
      this.props.refresh && this.props.refresh()
    }
    this.setState({ loading: true })
    axios.post('/api/module/install/' + this.props.module.name)
    .then(fin)
    .catch(fin)
  }

  handleUninstall() {
    const fin = () => {
      this.setState({ loading: false })
      this.props.refresh && this.props.refresh()
    }
    this.setState({ loading: true })
    axios.delete('/api/module/uninstall/' + this.props.module.name)
    .then()
    .then(fin)
    .catch(fin)
  }

  renderLeftSideModule() {
    const { docLink, icon, description, author, license, name } = this.props.module

    return (
      <div>
        <a href={docLink} target="_blank">
          <h3 className={classnames(style.moduleTitle, 'bp-module-title')}>
            <i className='icon material-icons'>{icon}</i>
            {name}
          </h3>
        </a>
        <p className={classnames(style.moduleDescription, 'bp-module-description')}>{description}</p>
        <p className={classnames(style.moduleAuthor, 'bp-module-author')}>{author}</p>
        <p className={classnames(style.moduleLicense, 'bp-module-license')}>{license}</p>
      </div>
    )
  }

  renderManageButton() {
    const { installed } = this.props.module

    const text = installed ? 'Uninstall' : 'Install'
    const action = installed ? this.handleUninstall : this.handleInstall

    const className = classnames({
      [style.install]: !installed,
      [style.uninstall]: installed
    })

    return (
      <Button className={className} onClick={action} loading={this.state.loading}>
        {text}
      </Button>
    )
  }

  renderRightSideModule() {
    const { stars, forks } = this.props.module

    return (
      <div>
        <div className={style.moduleIcons}>
          <i className='icon material-icons'>star</i>
          {numberWithCommas(stars)}
        </div>
        <div className={style.moduleIcons}>
          <i className='icon material-icons'>merge_type</i>
          {numberWithCommas(forks)}
        </div>
        <div className={style.moduleButton}>
          {this.renderManageButton()}
        </div>
      </div>
    )
  }

  render() {
    const module = this.props.module

    return (
      <Panel key={module.name} className={classnames(style.modulePanel, 'bp-module-panel')}>
        <Grid fluid>
          <Row>
            <Col sm={8}>
              {this.renderLeftSideModule()}
            </Col>
            <Col sm={4} className={style.moduleRightSide}>
              {this.renderRightSideModule()}
            </Col>
          </Row>
        </Grid>
      </Panel>
    )
  }
}

export default class ModulesComponent extends Component {
  render() {
    return (
      <div>
        {_.values(_.map(this.props.modules, module => {
          return <ModuleComponent key={module.name} module={module} refresh={this.props.refresh}/>
        }))}
      </div>
    )
  }
}
