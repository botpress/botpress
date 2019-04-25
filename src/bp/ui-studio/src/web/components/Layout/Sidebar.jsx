import React from 'react'
import PropTypes from 'prop-types'
import { connect } from 'react-redux'
import { NavLink, withRouter } from 'react-router-dom'
import classnames from 'classnames'
import { Collapse } from 'react-bootstrap'
import _ from 'lodash'

import PermissionsChecker from './PermissionsChecker'

const style = require('./Sidebar.scss')

const BASIC_MENU_ITEMS = [
  {
    name: 'Content',
    path: '/content',
    rule: { res: 'bot.content', op: 'read' },
    icon: 'description'
  },
  {
    name: 'Flows',
    path: '/flows',
    rule: { res: 'bot.flows', op: 'read' },
    icon: 'device_hub'
  }
].filter(Boolean)

class Sidebar extends React.Component {
  static contextTypes = {
    router: PropTypes.object.isRequired
  }

  state = {
    nluCollapseOpen: false
  }

  componentDidMount() {
    const mql = window.matchMedia(`(min-width: 800px)`)
    mql.addListener(this.mediaQueryChanged)
    this.setState({ mql, sidebarDocked: mql.matches })
  }

  componentWillUnmount() {
    this.state.mql.removeListener(this.mediaQueryChanged)
  }

  mediaQueryChanged = () => this.setState({ sidebarDocked: this.state.mql.matches })

  showNluMenu = () => this.setState({ nluCollapseOpen: true })
  hideNluMenu = () => this.setState({ nluCollapseOpen: false })

  renderModuleItem = module => {
    const path = `/modules/${module.name}`
    const iconPath = `/assets/modules/${module.name}/icon.png`
    const moduleIcon =
      module.menuIcon === 'custom' ? (
        <img className={classnames(style.customIcon, 'bp-custom-icon')} src={iconPath} />
      ) : (
        <i className="icon material-icons" style={{ marginRight: '5px' }}>
          {module.menuIcon}
        </i>
      )

    const entitiesPath = path + '/Entities'
    const intentsPath = path + '/Intents'

    const isNluActive = _.get(this.context.router, 'route.location.pathname', '')
      .toLowerCase()
      .includes('/modules/nlu/')

    // TODO: Make generic menu and submenu and use them for intents / entities ui
    if (module.name === 'nlu') {
      return (
        <li key={`menu_module_${module.name}`}>
          <a
            onMouseOver={this.showNluMenu}
            onMouseOut={this.hideNluMenu}
            className={classnames(style.link, { [style.active]: isNluActive })}
          >
            {moduleIcon}
            <span>Understanding</span>
          </a>
          <Collapse in={this.state.nluCollapseOpen} onMouseOver={this.showNluMenu} onMouseOut={this.hideNluMenu}>
            <ul className={style.mainMenu_level2}>
              <li className={style.mainMenu__item}>
                <NavLink
                  to={entitiesPath}
                  activeClassName={style.active}
                  title={module.menuText}
                  className={style.mainMenu__link}
                >
                  <span>Entities</span>
                </NavLink>
              </li>
              <li className={style.mainMenu__item}>
                <NavLink
                  activeClassName={style.active}
                  to={intentsPath}
                  title={module.menuText}
                  className={style.mainMenu__link}
                >
                  <span>Intents</span>
                </NavLink>
              </li>
            </ul>
          </Collapse>
        </li>
      )
    } else {
      return (
        <li key={`menu_module_${module.name}`}>
          <NavLink to={path} title={module.menuText} activeClassName={style.active}>
            {moduleIcon}
            <span>{module.menuText}</span>
          </NavLink>
        </li>
      )
    }
  }

  renderBasicItem = ({ name, path, rule, icon, renderSuffix }) => (
    <PermissionsChecker user={this.props.user} res={rule.res} op={rule.op} key={name}>
      <li key={path}>
        <NavLink to={path} title={name} activeClassName={style.active}>
          <i className="icon material-icons" style={{ marginRight: '5px' }}>
            {icon}
          </i>
          {name}
          {renderSuffix && renderSuffix()}
        </NavLink>
      </li>
    </PermissionsChecker>
  )

  render() {
    const modules = this.props.modules
    const moduleItems = modules.filter(x => !x.noInterface).map(this.renderModuleItem)
    const emptyClassName = classnames(style.empty, 'bp-empty')

    return (
      <aside style={{ zIndex: '1000' }}>
        <div className={classnames(style.sidebar, 'bp-sidebar')}>
          <div style={{ padding: '8px 13px' }}>
            <a href={window.BP_BASE_PATH} className={classnames(style.logo, 'bp-logo')}>
              <img width="125" src="/assets/ui-studio/public/img/logo_white.png" alt="Botpress Logo" />
            </a>
          </div>
          <ul className={classnames('nav', style.mainMenu)}>
            {BASIC_MENU_ITEMS.map(this.renderBasicItem)}
            {moduleItems}
            <li className={emptyClassName} />
          </ul>
        </div>
        {this.props.children}
      </aside>
    )
  }
}

const mapStateToProps = state => ({
  user: state.user,
  viewMode: state.ui.viewMode,
  modules: state.modules
})

export default withRouter(connect(mapStateToProps)(Sidebar))
