import React, { Component, Fragment } from 'react'

import { IoIosBoxOutline } from 'react-icons/lib/io'
import { FaPlusCircle } from 'react-icons/lib/fa'
import { connect } from 'react-redux'
import { Jumbotron, Row, Col, Button, Alert } from 'reactstrap'

import _ from 'lodash'

import { fetchBots } from '../../../reducers/bots'
import { fetchPermissions } from '../../../reducers/user'
import { fetchLicensing } from '../../../reducers/license'

import SectionLayout from '../../Layouts/Section'
import LoadingSection from '../../Components/LoadingSection'

import api from '../../../api'
import { AccessControl } from '../../../App/AccessControl'
import CreateBotModal from './CreateBotModal'
import BotItemPipeline from './BotItemPipeline'
import BotItemCompact from './BotItemCompact'
import RollbackBotModal from './RollbackBotModal'
import { toast } from 'react-toastify'

class Bots extends Component {
  state = {
    isCreateBotModalOpen: false,
    focusedBot: null,
    isRollbackModalOpen: false
  }

  renderLoading() {
    return <LoadingSection />
  }

  componentDidMount() {
    this.downloadLink = React.createRef()
    this.props.fetchBots()
    this.props.fetchPermissions()
    if (!this.props.licensing) {
      this.props.fetchLicensing()
    }
  }

  toggleCreateBotModal = () => {
    this.setState({ isCreateBotModalOpen: !this.state.isCreateBotModalOpen })
  }

  async exportBot(botId) {
    const { data } = await api.getSecured({ timeout: 10000 })({
      method: 'get',
      url: `/admin/bots/${botId}/export`,
      responseType: 'blob'
    })

    this.setState(
      {
        downloadLinkHref: window.URL.createObjectURL(new Blob([data])),
        downloadLinkFileName: `bot_${botId}_${Date.now()}.tgz`
      },
      () => this.downloadLink.current.click()
    )
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

  renderCreateNewBotButton() {
    return (
      <AccessControl permissions={this.props.permissions} resource="admin.bots.*" operation="write">
        <Button
          onClick={() => this.setState({ isCreateBotModalOpen: true })}
          outline
          color="primary"
          className="createbot_btn"
        >
          <FaPlusCircle />
          &nbsp;Create Bot
        </Button>
      </AccessControl>
    )
  }

  hasUnlangedBots = () => {
    return this.props.bots.reduce((hasUnlangedBots, bot) => hasUnlangedBots || !bot.defaultLanguage, false)
  }

  async requestStageChange(botId) {
    await api.getSecured().post(`/admin/bots/${botId}/stage`)
    await this.props.fetchBots()
  }

  isLicensed = () => {
    return _.get(this.props.licensing, 'status') === 'licensed'
  }

  async createRevision(botId) {
    await api.getSecured().post(`admin/bots/${botId}/revisions`)
    toast.success('Revisions created')
  }

  toggleRollbackModal = botId => {
    this.setState({
      focusedBot: typeof botId === 'string' ? botId : null,
      isRollbackModalOpen: !this.state.isRollbackModalOpen
    })
  }

  handleRollbackSuccess = () => {
    this.props.fetchBots()
    toast.success('Rollback success')
  }

  renderCompactView() {
    return (
      <div className="bp_table bot_views compact_view">
        {this.props.bots.map(bot => (
          <BotItemCompact
            key={bot.id}
            bot={bot}
            history={this.props.history}
            deleteBot={this.deleteBot.bind(this, bot.id)}
            exportBot={this.exportBot.bind(this, bot.id)}
            permissions={this.props.permissions}
            createRevision={this.createRevision.bind(this, bot.id)}
            rollback={this.toggleRollbackModal.bind(this, bot.id)}
          />
        ))}
      </div>
    )
  }

  renderPipelineView() {
    const pipeline = this.props.workspace.pipeline
    const botsByStage = _.groupBy(this.props.bots, 'pipeline_status.current_stage.id')
    const colSize = Math.floor(12 / pipeline.length)

    return (
      <Fragment>
        <Row className="pipeline_view bot_views">
          {pipeline.map((stage, idx) => {
            const allowStageChange = this.isLicensed() && idx !== pipeline.length - 1
            return (
              <Col key={stage.id} md={colSize}>
                {pipeline.length > 1 && <h3 className="pipeline_title">{stage.label}</h3>}
                {idx === 0 && <div className="pipeline_bot create">{this.renderCreateNewBotButton()}</div>}
                {(botsByStage[stage.id] || []).map(bot => (
                  <BotItemPipeline
                    key={bot.id}
                    bot={bot}
                    history={this.props.history}
                    allowStageChange={allowStageChange}
                    requestStageChange={this.requestStageChange.bind(this, bot.id)}
                    deleteBot={this.deleteBot.bind(this, bot.id)}
                    exportBot={this.exportBot.bind(this, bot.id)}
                    permissions={this.props.permissions}
                    createRevision={this.createRevision.bind(this, bot.id)}
                    rollback={this.toggleRollbackModal.bind(this, bot.id)}
                  />
                ))}
              </Col>
            )
          })}
        </Row>
      </Fragment>
    )
  }

  renderBots() {
    const botsView = this.isPipelineView ? this.renderPipelineView() : this.renderCompactView()
    return (
      <div>
        {this.hasUnlangedBots() && (
          <Alert color="warning">
            You have bots without specified language. Default language is mandatory since Botpress 11.8. Please set bot
            language in the bot config page.
          </Alert>
        )}
        {botsView}
      </div>
    )
  }

  get isPipelineView() {
    return this.props.workspace.pipeline.length > 1
  }

  render() {
    if (!this.props.bots) {
      return <LoadingSection />
    }

    return (
      <Fragment>
        <a ref={this.downloadLink} href={this.state.downloadLinkHref} download={this.state.downloadLinkFileName}>
          {' '}
        </a>
        <SectionLayout
          title={`Your bots`}
          helpText="This page lists all the bots created under the default workspace."
          activePage="bots"
          mainContent={this.props.bots.length > 0 ? this.renderBots() : this.renderEmptyBots()}
          sideMenu={!this.isPipelineView && this.renderCreateNewBotButton()}
        />
        <RollbackBotModal
          botId={this.state.focusedBot}
          isOpen={this.state.isRollbackModalOpen}
          toggle={this.toggleRollbackModal}
          onRollbackSuccess={this.handleRollbackSuccess}
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
  permissions: state.user.permissions,
  licensing: state.license.licensing
})

const mapDispatchToProps = {
  fetchBots,
  fetchLicensing,
  fetchPermissions
}

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(Bots)
