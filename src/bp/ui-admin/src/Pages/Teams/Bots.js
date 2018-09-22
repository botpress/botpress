import React, { Component } from 'react'

import { IoIosBoxOutline } from 'react-icons/lib/io'
import { MdCreate } from 'react-icons/lib/md'

import { bindActionCreators } from 'redux'
import { connect } from 'react-redux'
import { checkRule } from '@botpress/util-roles'

import jdenticon from 'jdenticon'

import {
  ListGroup,
  Jumbotron,
  UncontrolledDropdown,
  DropdownToggle,
  DropdownMenu,
  DropdownItem,
  ListGroupItemHeading,
  ListGroupItem,
  Row,
  Col,
  Button
} from 'reactstrap'

import _ from 'lodash'

import { fetchTeamData } from '../../modules/teams'
import { fetchPermissions } from '../../modules/user'

import SectionLayout from '../Layouts/Section'
import LoadingSection from '../Components/LoadingSection'
import { getMenu } from './menu'

import api from '../../api'

class Bots extends Component {
  renderLoading() {
    return <LoadingSection />
  }

  componentDidMount() {
    this.props.fetchTeamData(this.props.teamId, { bots: true })
    this.props.fetchPermissions(this.props.teamId)
  }

  componentDidUpdate(prevProps) {
    if ((!this.props.bots && !this.props.loading) || prevProps.teamId !== this.props.teamId) {
      this.props.fetchTeamData(this.props.teamId, { bots: true })
    }
    if (prevProps.teamId !== this.props.teamId) {
      this.props.fetchPermissions(this.props.teamId)
    }
  }

  createBot = async () => {
    if (window.confirm('Are you sure you want create the new bot?')) {
      await api.getSecured().post(`/api/teams/${this.props.teamId}/bots`)
      await this.props.fetchTeamData(this.props.teamId)
    }
  }

  async deleteBot(botId) {
    if (window.confirm("Are you sure you want to delete this bot? This can't be undone.")) {
      await api.getSecured().delete(`/api/teams/${this.props.teamId}/bots/${botId}`)
      await this.props.fetchTeamData(this.props.teamId)
    }
  }

  currentUserHasPermission = (resource, operation) => {
    if (!this.props.currentUserPermissions) {
      return false
    }
    return checkRule(this.props.currentUserPermissions, operation, resource)
  }

  renderEmptyBots() {
    return (
      <div className="bots">
        <Jumbotron>
          <Row>
            <Col style={{ textAlign: 'center' }} sm="12" md={{ size: 8, offset: 2 }}>
              <h1>
                <IoIosBoxOutline />
                &nbsp; This team has no bot, yet.
              </h1>
              <p>
                In Botpress, bots are always assigned to a team.
                <br />
                <Button color="success" onClick={this.createBot}>
                  <MdCreate /> Create Bot Now
                </Button>
              </p>
            </Col>
          </Row>
        </Jumbotron>
      </div>
    )
  }

  renderBots() {
    const bots = _.orderBy(this.props.bots, ['id'], ['desc'])

    if (!bots.length) {
      return this.renderEmptyBots()
    }

    // TODO: bots properties editing (name, description)
    // and show bots info (author, version, license)

    return (
      <div className="bots">
        <ListGroup>
          {bots.map(bot => {
            return (
              <ListGroupItem key={'bot-' + bot.id}>
                <ListGroupItemHeading className="header">
                  <svg width="32" height="32" data-jdenticon-value={bot.name} />
                  <a className="title" href={`/studio/${bot.id}`}>
                    {bot.name}
                  </a>

                  <UncontrolledDropdown className="float-right">
                    <DropdownToggle caret size="sm" color="link">
                      More
                    </DropdownToggle>
                    <DropdownMenu>
                      <DropdownItem className="text-danger" onClick={() => this.deleteBot(bot.id)}>
                        Delete
                      </DropdownItem>
                    </DropdownMenu>
                  </UncontrolledDropdown>
                </ListGroupItemHeading>
                <div className="description">{bot.description}</div>
              </ListGroupItem>
            )
          })}
        </ListGroup>
      </div>
    )
  }

  renderSideMenu() {
    return null
  }

  render() {
    if (this.props.loading || !this.props.bots) {
      return this.renderLoading()
    }

    setTimeout(() => {
      jdenticon()
    }, 10)

    const sections = getMenu({
      teamId: this.props.team.id,
      currentPage: 'bots',
      userHasPermission: this.currentUserHasPermission
    })

    return (
      <SectionLayout
        title={`${this.props.team.name}'s bots`}
        helpText="This page lists all the bots created under this team."
        sections={sections}
        mainContent={this.renderBots()}
        sideMenu={this.renderSideMenu()}
      />
    )
  }
}

const mapStateToProps = state => ({
  bots: state.teams.bots,
  teamId: state.teams.teamId,
  team: state.teams.team,
  loading: state.teams.loadingTeam,
  currentUserPermissions: state.user.permissions[state.teams.teamId]
})

const mapDispatchToProps = dispatch =>
  bindActionCreators(
    {
      fetchTeamData,
      fetchPermissions
    },
    dispatch
  )

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(Bots)
