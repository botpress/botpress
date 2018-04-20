import React from 'react'
import { connect } from 'react-redux'
import { Panel, Grid, Row, Col } from 'react-bootstrap'

import Button from 'react-bootstrap-button-loader'
import classnames from 'classnames'

import _ from 'lodash'

const style = require('./style.scss')

const numberWithCommas = x => x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',')

class ModuleComponent extends React.Component {
  state = {
    loading: false
  }

  renderLeftSideModule() {
    const { docLink, icon, description, author, license, title, name } = this.props.module
    const isLoaded = this.props.isLoaded
    const iconPath = `/img/modules/${name}.png`

    const hasCustomIcon = icon === 'custom' && isLoaded
    const moduleIcon = hasCustomIcon ? (
      <img className={classnames(style.customIcon, 'bp-custom-icon')} src={iconPath} />
    ) : (
      <i className="icon material-icons">{icon === 'custom' ? 'extension' : icon}</i>
    )

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

  renderRightSideModule() {
    const { stars, forks, installed } = this.props.module

    return (
      <div>
        <div className={style.moduleIcons}>
          <i className="icon material-icons">star</i>
          {numberWithCommas(stars)}
        </div>
        <div className={style.moduleIcons}>
          <i className="icon material-icons">merge_type</i>
          {numberWithCommas(forks)}
        </div>
        <div className={style.moduleButton}>{installed && 'Installed'}</div>
      </div>
    )
  }

  render() {
    const module = this.props.module

    return (
      <Panel key={module.name} className={classnames(style.modulePanel, 'bp-module-panel')}>
        <Panel.Body>
          <Grid fluid>
            <Row>
              <Col sm={8}>{this.renderLeftSideModule()}</Col>
              <Col sm={4} className={style.moduleRightSide}>
                {this.renderRightSideModule()}
              </Col>
            </Row>
          </Grid>
        </Panel.Body>
      </Panel>
    )
  }
}

class ModulesComponent extends React.Component {
  render() {
    const installedModules = {}
    this.props.installedModules.map(module => {
      const name = module.name
      installedModules[name] = true
    })
    return (
      <div>
        {_.values(
          _.map(this.props.modules, module => {
            return (
              <ModuleComponent
                key={module.name}
                module={module}
                refresh={this.props.refresh}
                isLoaded={installedModules[module.name]}
              />
            )
          })
        )}
      </div>
    )
  }
}

const mapStateToProps = state => ({ installedModules: state.modules })

export default connect(mapStateToProps)(ModulesComponent)
