import React, { Component } from 'react'
import { CopyToClipboard } from 'react-copy-to-clipboard'

import { MdLink } from 'react-icons/lib/md'
import { IoIosBoxOutline } from 'react-icons/lib/io'

import { bindActionCreators } from 'redux'
import { connect } from 'react-redux'
import classnames from 'classnames'
import moment from 'moment'
import { checkRule } from '@botpress/util-roles'

import jdenticon from 'jdenticon'

import {
  ListGroup,
  Badge,
  Jumbotron,
  UncontrolledDropdown,
  DropdownToggle,
  DropdownMenu,
  DropdownItem,
  ListGroupItemHeading,
  ListGroupItem,
  Button,
  Row,
  Col,
  Modal,
  ModalHeader,
  ModalBody,
  ModalFooter
} from 'reactstrap'

import _ from 'lodash'

import { fetchTeamData } from '../../modules/teams'
import { fetchPermissions } from '../../modules/user'

import SectionLayout from '../Layouts/Section'
import LoadingSection from '../Components/LoadingSection'
import { getMenu } from './menu'

import api from '../../api'

class Bots extends Component {
  state = { pairingToken: null, isPairingModalOpen: false, copied: false }

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

  getColorForLabel(name) {
    if (/^dev/i.test(name)) {
      return 'primary'
    } else if (/^stag/i.test(name)) {
      return 'warning'
    } else if (/^prod/i.test(name)) {
      return 'danger'
    } else {
      return 'default'
    }
  }

  togglePairingModal = () => {
    if (!this.state.isPairingModalOpen) {
      this.fetchPairingToken()
      this.setState({ isPairingModalOpen: true })
    } else {
      this.setState({ isPairingModalOpen: false })
    }
  }

  async fetchPairingToken() {
    const { data } = await api.getSecured().post(`/api/teams/${this.props.teamId}/bots`)

    if (data && data.payload && data.payload.pairingToken) {
      this.setState({ pairingToken: data.payload.pairingToken })
    }
  }

  async deleteBot(botId) {
    if (window.confirm("Are you sure you want to delete this bot? This can't be undone.")) {
      await api.getSecured().delete(`/api/teams/${this.props.teamId}/bots/${botId}`)
      await this.props.fetchTeamData(this.props.teamId)
    }
  }

  onCopy = () => {
    this.setState({ copied: true })
    window.setTimeout(() => {
      this.setState({ copied: false })
    }, 750)
  }

  renderPairingModal() {
    const instruction = 'botpress cloud-pair ' + this.state.pairingToken

    return (
      <Modal isOpen={this.state.isPairingModalOpen} toggle={this.togglePairingModal}>
        <ModalHeader toggle={this.togglePairingModal}>Add a new bot to this team</ModalHeader>
        <ModalBody>
          <h3>Instructions</h3>
          <p>In a terminal, at the root of the Botpress bot you want to pair, run the following command:</p>
          <pre className="code text-white">{instruction}</pre>
          <div>
            <CopyToClipboard text={instruction} onCopy={this.onCopy}>
              <small>
                <Button color="secondary" href="#" disabled={this.state.copied}>
                  {this.state.copied ? 'Copied!' : 'Copy to clipboard'}
                </Button>
              </small>
            </CopyToClipboard>
          </div>
        </ModalBody>
        <ModalFooter>
          <Button color="primary" onClick={this.togglePairingModal}>
            Done
          </Button>
        </ModalFooter>
      </Modal>
    )
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
                <IoIosBoxOutline />&nbsp; This team has no bot, yet.
              </h1>
              <p>
                In Botpress, bots are always assigned to a team. In order to manage and share a bot with your team, you
                must first{' '}
                <a target="_blank" href="https://botpress.io/docs/10.0/" rel="noopener noreferrer">
                  create a bot
                </a>.
              </p>
              <hr />
              <p>Once your bot is created locally on your computer, you can link this bot to this team.</p>
              <Button size="lg" color="primary" onClick={this.togglePairingModal}>
                <MdLink /> Pair existing bot
              </Button>
            </Col>
          </Row>
        </Jumbotron>
      </div>
    )
  }

  renderBots() {
    const bots = this.props.bots.map(bot => {
      return {
        ...bot,
        lastStartedAt: _.get(_.maxBy(bot.envs, 'lastStartedAt'), 'lastStartedAt'),
        isStarted: _.some(bot.envs, { recentlyActive: true })
      }
    })

    const sortedBots = _.orderBy(bots, ['lastStartedAt'], ['desc'])

    if (!sortedBots.length) {
      return this.renderEmptyBots()
    }

    return (
      <div className="bots">
        <ListGroup>
          {sortedBots.map(bot => {
            const startedAgo = moment(bot.lastStartedAt).fromNow()

            return (
              <ListGroupItem key={'bot-' + bot.id}>
                <ListGroupItemHeading className="header">
                  <svg width="32" height="32" data-jdenticon-value={bot.name} />
                  <span className="title">{bot.name}</span>

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
                {bot.isStarted && (
                  <div className="tags">
                    {bot.envs.filter(x => x.recentlyActive).map(env => {
                      const className = classnames('env', {
                        old: !env.recentlyActive
                      })
                      const href = env.botUrl
                      return (
                        <span key={env.name} className={className}>
                          <Badge
                            href={href}
                            target="_blank"
                            rel="noopener noreferrer"
                            color={this.getColorForLabel(env.name)}
                          >
                            {env.name}
                          </Badge>
                        </span>
                      )
                    })}
                  </div>
                )}
                {bot.isStarted ? (
                  <small>Last synced {startedAgo}</small>
                ) : (
                  <span>
                    <small className="text-danger">Not running</small>
                    <small>&nbsp;| Last started {startedAgo}</small>
                  </span>
                )}
              </ListGroupItem>
            )
          })}
        </ListGroup>
      </div>
    )
  }

  renderSideMenu() {
    return (
      <div>
        <Button color="primary" outline onClick={this.togglePairingModal}>
          <MdLink /> Pair existing bot
        </Button>
        {this.renderPairingModal()}
      </div>
    )
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
        helpText="On this page you'll find all the bots that have been associated with this team."
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
