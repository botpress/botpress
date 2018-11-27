import React, { Component } from 'react'
import { connect } from 'react-redux'
import orderBy from 'lodash/orderBy'
import moment from 'moment'

import { Alert, Button, Modal, Panel } from 'react-bootstrap'

import ContentWrapper from '~/components/Layout/ContentWrapper'
import PageHeader from '~/components/Layout/PageHeader'
import PermissionsChecker from '~/components/Layout/PermissionsChecker'
import Loading from '~/components/Util/Loading'
import About from './About'

import { fetchStatus, getHost, revertPendingFileChanges, revertPendingFileChangesXX, exportArchiveXX } from './util'

import style from './style.scss'

class GhostView extends Component {
  state = {
    loading: true,
    data: null,
    error: null,
    showAbout: false,
    showSyncHelp: false
  }

  showAbout = () => {
    this.setState({ showAbout: true })
  }

  hideAbout = () => {
    this.setState({ showAbout: false })
  }

  showSyncHelp = () => {
    this.setState({ showSyncHelp: true })
  }

  hideSyncHelp = () => {
    this.setState({ showSyncHelp: false })
  }

  fetch() {
    this.setState({ loading: true })

    fetchStatus()
      .then(data => {
        this.setState({ data, loading: false, error: null })
      })
      .catch(error => {
        this.setState({ error: error.message || 'Unknown', loading: false })
      })
  }

  componentDidMount() {
    this.fetch()
  }

  renderRevision({ folder, file, revision, created_on: createdOn }, index) {
    const mostRecent = index === 0 ? '(most recent)' : ''
    const timeAgo = moment.utc(createdOn).fromNow()

    return (
      <li key={`${folder}/${file}/${revision}`}>
        Revision <code>{revision}</code> – Edited {timeAgo} {mostRecent}
      </li>
    )
  }

  revertFile(folder, file) {
    return revertPendingFileChanges(folder, file).then(() => this.fetch())
  }

  revertFileXX(data) {
    return revertPendingFileChangesXX(data).then(() => this.fetch())
  }

  renderFile(folder, file, data) {
    data = orderBy(data, ['created_on'], ['desc'])

    const undo = () => {
      if (confirm('Are you sure you want to revert these changes? Changes will be lost and this is not reversible.')) {
        if (window.BOTPRESS_XX) {
          return this.revertFileXX(data[0])
        }

        this.revertFile(folder, file)
      }
    }

    return (
      <li key={`${folder}/${file}`}>
        <details>
          <summary>
            {file}
            <PermissionsChecker user={this.props.user} op="write" res="bot.ghost_content">
              {' '}
              <a href="javascript:void(0);" onClick={undo}>
                Revert changes
              </a>
            </PermissionsChecker>
          </summary>
          <ul>{data.map((datum, i) => this.renderRevision(Object.assign({ folder }, datum), i))}</ul>
        </details>
      </li>
    )
  }

  renderFolder(folder, data) {
    const files = Object.keys(data).sort()

    return (
      <Panel collapsible="true" defaultExpanded key={folder}>
        <Panel.Heading>{folder}</Panel.Heading>
        <Panel.Body>
          <ul className={style.files}>{files.map(file => this.renderFile(folder, file, data[file]))}</ul>
        </Panel.Body>
      </Panel>
    )
  }

  renderContent() {
    const { data, showSyncHelp } = this.state
    const folders = Object.keys(data).sort()

    if (!folders.length) {
      return (
        <Alert bsStyle="success">
          <p>Your bot is in sync with the source code (no pending changes).</p>
        </Alert>
      )
    }

    return (
      <div>
        <Alert bsStyle="warning">
          <p>
            Below are the changes you made to the bot since last sync. You need to eventually sync it up with the bot
            source code.&nbsp;
            {!window.BOTPRESS_XX && (
              <Button bsSize="small" bsStyle="info" onClick={this.showSyncHelp}>
                Show me how to do it
              </Button>
            )}
          </p>
        </Alert>
        {this.renderDownload()}
        {showSyncHelp && (
          <Alert bsStyle="info" onDismiss={this.hideSyncHelp}>
            <p>
              <strong>To pull the pending ghost content run in your bot&apos;s project folder:</strong>
            </p>
            <p>
              <code>./node_modules/.bin/botpress ghost-sync {getHost()}</code>
            </p>
          </Alert>
        )}
        <ul className={style.folders}>{folders.map(folder => this.renderFolder(folder, data[folder]))}</ul>
      </div>
    )
  }

  renderDownload() {
    const { data } = this.state
    const hasChanges = Object.keys(data).length > 0
    if (!window.BOTPRESS_XX || !hasChanges) {
      return null
    }

    return (
      <p>
        <Button onClick={() => exportArchiveXX()}>Export Changes</Button>
      </p>
    )
  }

  renderBody() {
    const { loading, error } = this.state

    if (loading) {
      return <Loading />
    }

    if (error) {
      return (
        <Alert bsStyle="danger">
          <p>Error fetching status dta: {error}.</p>
          <p>
            <Button bsStyle="info" onClick={() => this.fetch()}>
              Try again
            </Button>
          </p>
        </Alert>
      )
    }

    return this.renderContent()
  }

  render() {
    return (
      <ContentWrapper>
        <PageHeader>Version Control</PageHeader>
        {this.renderBody()}

        <Modal show={this.state.showAbout} onHide={this.hideAbout}>
          <Modal.Header closeButton>
            <Modal.Title>Version Control</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <About />
          </Modal.Body>
          <Modal.Footer>
            <Button onClick={this.hideAbout}>Close</Button>
          </Modal.Footer>
        </Modal>
      </ContentWrapper>
    )
  }
}

const mapStateToProps = state => ({
  user: state.user
})

export default connect(mapStateToProps)(GhostView)
