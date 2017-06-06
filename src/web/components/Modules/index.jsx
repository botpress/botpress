import React, { Component } from 'react'

import ContentWrapper from '~/components/Layout/ContentWrapper'

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
import { connect } from 'nuclear-js-react-addons'
import getters from '~/stores/getters'

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
    const { docLink, icon, description, author, license, title, name } = this.props.module
    const isLoaded = this.props.isLoaded
    const iconPath = `/img/modules/${name}.png`

    const hasCustomIcon = icon  === 'custom' && isLoaded
    const moduleIcon = hasCustomIcon
      ? <img className={classnames(style.customIcon, 'bp-custom-icon')} src={iconPath} />
      : <i className="icon material-icons">{icon === "custom" ? "extension" : icon}</i>

    return (
      <div>
        <a href={docLink} target="_blank">
          <h3 className={classnames(style.moduleTitle, 'bp-module-title')}>
            {moduleIcon}
            {title}
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
      ['bp-button']: true,
      [style.uninstall]: installed,
      ['bp-button-default']: installed
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

@connect(props => ({
  installedModules: getters.modules
}))
export default class ModulesComponent extends Component {
  render() {
    var installedModules = {};
    this.props.installedModules.map((module)=>{
      const name = module.get("name")
      installedModules[name] = true
    });
    return (
      <div>
        {_.values(_.map(this.props.modules, module => {
          return <ModuleComponent key={module.name} module={module} refresh={this.props.refresh} isLoaded={installedModules[module.name]}/>
        }))}
      </div>
    )
  }
}
