import React, { Component } from 'react'
import { bindActionCreators } from 'redux'
import { connect } from 'react-redux'
import { Navbar, Nav, NavItem, NavLink, Badge } from 'reactstrap'
import { checkRule } from '@botpress/util-roles'
import { Link } from 'react-router-dom'
import { fetchLicense } from '../../modules/license'
import { fetchPermissions } from '../../modules/user'
import _ from 'lodash'

class Menu extends Component {
  constructor(props) {
    super(props)
    this.state = { menu: [], currentTeam: undefined }
  }

  componentDidMount() {
    this.props.fetchLicense()
    this.generateMenu()
  }

  componentDidUpdate(prevProps) {
    if (prevProps !== this.props) {
      this.generateMenu()
    }
  }

  generateMenu() {
    const activePage = this.props.activePage
    const currentTeamId = this.props.currentTeam && this.props.currentTeam.id

    const menu = [
      {
        title: 'Users',
        active: activePage === 'users',
        show: true,
        disabled: this.isCommunity(),
        link: '/users',
        isPro: true
      },
      {
        title: 'Teams',
        active: activePage === 'teams',
        show: true,
        link: '/teams',
        subHeader: this.props.currentTeam && this.props.currentTeam.name,
        childs: [
          {
            title: 'Bots',
            active: activePage === 'bots',
            link: `/teams/${currentTeamId}/bots`,
            show: this.checkPermissions('admin.team.bots', 'read')
          },
          {
            title: 'Members',
            active: activePage === 'members',
            link: `/teams/${currentTeamId}/members`,
            show: this.checkPermissions('admin.team.members', 'read'),
            isPro: true
          },
          {
            title: 'Roles',
            active: activePage === 'roles',
            link: `/teams/${currentTeamId}/roles`,
            show: this.checkPermissions('admin.team.roles', 'read'),
            isPro: true
          }
        ]
      }
    ]

    this.setState({ menu })
  }

  checkPermissions = (resource, operation) => {
    if (!this.props.currentTeam || !this.props.currentUserPermissions) {
      return false
    }

    return checkRule(this.props.currentUserPermissions, operation, resource)
  }

  render() {
    const filtered = _.filter(this.state.menu, { show: true })
    return (
      <Navbar>
        <Nav className="bp-menu-aside-level1">
          {filtered.map(section => (
            <NavItem key={section.title} active={section.active}>
              <NavLink className="btn-sm" tag={Link} disabled={section.disabled} to={section.link}>
                {section.title} {this.renderBadge(section.isPro)}
              </NavLink>
              {this.renderSubMenu(section.childs, section.subHeader)}
            </NavItem>
          ))}
        </Nav>
      </Navbar>
    )
  }

  renderSubMenu(childs, subHeader) {
    const filtered = _.filter(childs, { show: true })
    return (
      <Nav className="bp-menu-aside-level2">
        {subHeader && <div className="bp-menu-aside-level2__botname">{subHeader}</div>}
        {filtered.map(child => (
          <NavItem key={child.title} active={child.active}>
            <NavLink
              className="btn-sm"
              tag={Link}
              disabled={child.disabled || (child.isPro && this.isCommunity())}
              to={child.link}
            >
              {child.title} {this.renderBadge(child.isPro)}
            </NavLink>
          </NavItem>
        ))}
      </Nav>
    )
  }

  renderBadge = isBadge => (isBadge && this.isCommunity() ? <Badge color="primary">Pro</Badge> : null)
  isCommunity = () => this.props.license && this.props.license.edition === 'ce'
}

const mapStateToProps = state => ({
  teams: state.teams.items,
  license: state.license.license,
  currentUserPermissions: state.user.permissions[state.teams.teamId]
})

const mapDispatchToProps = dispatch =>
  bindActionCreators(
    {
      fetchPermissions,
      fetchLicense
    },
    dispatch
  )
export default connect(
  mapStateToProps,
  mapDispatchToProps
)(Menu)
