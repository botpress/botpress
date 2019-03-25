import React, { Component, Fragment } from 'react'

import { IoIosBoxOutline } from 'react-icons/lib/io'
import { MdCreate } from 'react-icons/lib/md'
import { connect } from 'react-redux'
import jdenticon from 'jdenticon'
import { Jumbotron, Row, Col, Badge, Button } from 'reactstrap'

import _ from 'lodash'

import { fetchBots } from '../../reducers/bots'
import { fetchPermissions } from '../../reducers/user'

import SectionLayout from '../Layouts/Section'
import LoadingSection from '../Components/LoadingSection'

import api from '../../api'
import { AccessControl } from '../../App/AccessControl'
import CreateBotModal from './CreateBotModal'

class Bots extends Component {
  state = {
    isCreateBotModalOpen: false,
    errorCreateBot: undefined,
    errorEditBot: undefined,
    id: '',
    name: '',
    description: ''
  }

  renderLoading() {
    return <LoadingSection />
  }

  componentDidMount() {
    this.props.fetchBots()
    this.props.fetchPermissions()
  }

  toggleCreateBotModal = () => {
    this.setState({ isCreateBotModalOpen: !this.state.isCreateBotModalOpen })
  }

  async deleteBot(botId) {
    if (window.confirm("Are you sure you want to delete this bot? This can't be undone.")) {
      await api.getSecured().delete(`/admin/bots/${botId}`)
      await this.props.fetchBots()
    }
  }

  renderEmptyBots() {
    return (
      <div className="bots">
        <Jumbotron>
          <Row>
            <Col style={{ textAlign: 'center' }} sm="12" md={{ size: 8, offset: 2 }}>
              <h1>
                <IoIosBoxOutline />
                &nbsp; This workspace has no bot, yet.
              </h1>
              <p>In Botpress, bots are always assigned to a workspace.</p>
              <p>{this.renderCreateNewBotButton(true)}</p>
            </Col>
          </Row>
        </Jumbotron>
      </div>
    )
  }

  renderCreateNewBotButton(isCentered) {
    return (
      <AccessControl permissions={this.props.permissions} resource="admin.bots.*" operation="write">
        <Button
          className={isCentered ? '' : 'float-right'}
          onClick={() => this.setState({ isCreateBotModalOpen: true })}
          color="primary"
          size="sm"
        >
          <MdCreate /> Create Bot
        </Button>
      </AccessControl>
    )
  }

  renderBots() {
    return (
      <div className="bp_table">
        {_.orderBy(this.props.bots, ['id'], ['desc']).map(bot => (
          <div className="bp_table-row" key={bot.id}>
            <div className="actions">
              <Button tag="a" size="sm" color="link" target="_blank" href={`${window.location.origin}/s/${bot.id}`}>
                Open chat
              </Button>
              |
              <AccessControl permissions={this.props.permissions} resource="admin.bots.*" operation="write">
                <Button size="sm" color="link" onClick={() => this.props.history.push(`/bot/${bot.id}/details`)}>
                  Config
                </Button>
                |
                <Button size="sm" color="link" onClick={() => this.deleteBot(bot.id)}>
                  Delete
                </Button>
              </AccessControl>
            </div>
            <div className="title">
              {bot.disabled ? (
                <Fragment>
                  <span>{bot.name}</span>
                  <Badge color="danger" style={{ marginLeft: 10, fontSize: '60%' }}>
                    disabled
                  </Badge>
                </Fragment>
              ) : (
                <Fragment>
                  <a href={`/studio/${bot.id}`}>{bot.name}</a>
                  {bot.private && (
                    <Badge color="primary" style={{ marginLeft: 10, fontSize: '60%' }}>
                      private
                    </Badge>
                  )}
                </Fragment>
              )}
            </div>
            <p>{bot.description}</p>
          </div>
        ))}
      </div>
    )
  }

  render() {
    if (!this.props.bots) {
      return <LoadingSection />
    }

    setTimeout(() => {
      jdenticon()
    }, 10)

    return (
      <Fragment>
        <SectionLayout
          title={`Your bots`}
          helpText="This page lists all the bots created under the default workspace."
          activePage="bots"
          currentTeam={this.props.team}
          mainContent={this.props.bots.length > 0 ? this.renderBots() : this.renderEmptyBots()}
          sideMenu={this.renderCreateNewBotButton()}
        />
        <CreateBotModal
          isOpen={this.state.isCreateBotModalOpen}
          toggle={this.toggleCreateBotModal}
          onCreateBotSuccess={this.props.fetchBots}
        />
      </Fragment>
    )
  }
}

const mapStateToProps = state => ({
  bots: state.bots.bots,
  workspace: state.bots.workspace,
  loading: state.bots.loadingBots,
  permissions: state.user.permissions
})

const mapDispatchToProps = {
  fetchBots,
  fetchPermissions
}

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(Bots)
