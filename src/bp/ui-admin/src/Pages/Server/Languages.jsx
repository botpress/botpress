import React, { Fragment } from 'react'
import { Row, Col, Button, Alert, Progress } from 'reactstrap'
import api from '../../api'
import _ from 'lodash'

export default class Languages extends React.Component {
  state = {
    languages: undefined,
    activeDownload: undefined,
    waitingQueue: undefined,
    isDirty: false
  }

  componentDidMount() {
    this.fetchModels()
    this.refreshStatus()

    this.interval = setInterval(this.refreshStatus, 2000)
  }

  componentWillUnmount() {
    this.interval && clearInterval(this.interval)
  }

  async fetchModels() {
    const { data } = await api.getSecured().get('/admin/server/models')
    const { active, installed, metadata } = data

    this.setState({
      languages: metadata.languages,
      models: metadata.models,
      active,
      installed
    })
  }

  refreshStatus = async () => {
    const { data } = await api.getSecured().get('/admin/server/models/status')
    this.setState({ activeDownload: data.activeDownload, waitingQueue: data.waitingQueue })
  }

  downloadModel = async filename => {
    await api.getSecured().post('/admin/server/models/download', { filename })
    await this.refreshStatus()
    await this.fetchModels()
  }

  deleteModel = async filename => {
    await api.getSecured().post('/admin/server/models/delete', { filename })
    await this.fetchModels()
  }

  cancelDownload = async filename => {
    await api.getSecured().post('/admin/server/models/cancel', { filename })
    await this.fetchModels()
  }

  humanFileSize(size) {
    const i = Math.floor(Math.log(size) / Math.log(1024))
    return (size / Math.pow(1024, i)).toFixed(2) * 1 + ' ' + ['B', 'kB', 'MB', 'GB', 'TB'][i]
  }

  renderAction(filename, { isActive, isInstalled, isQueued, isDownloading }) {
    if (isActive) {
      return (
        <Fragment>
          <div style={{ width: 120 }}>In use</div>
        </Fragment>
      )

      return (
        <Fragment>
          <div style={{ width: 120 }}>In use</div>
          <Button color="link" disabled={true} onClick={() => this.deleteModel(filename)}>
            Delete
          </Button>
        </Fragment>
      )
    }
    if (isInstalled) {
      return (
        <Fragment>
          <div style={{ width: 120 }}>Installed</div>
          <Button color="link" onClick={() => this.deleteModel(filename)}>
            Delete
          </Button>
        </Fragment>
      )
    } else if (isDownloading) {
      return (
        <Fragment>
          <div style={{ width: 120 }}>Downloading...</div>
          <Button color="link" onClick={() => this.cancelDownload(filename)}>
            Cancel
          </Button>
        </Fragment>
      )
    } else if (isQueued) {
      return (
        <Fragment>
          <div style={{ width: 120 }}>Queued</div>
          <Button color="link" onClick={() => this.cancelDownload(filename)}>
            Cancel
          </Button>
        </Fragment>
      )
    } else {
      return (
        <Fragment>
          <div style={{ width: 120 }}>Not installed</div>
          <Button color="link" onClick={() => this.downloadModel(filename)}>
            Download
          </Button>
        </Fragment>
      )
    }
  }

  renderLanguage(code) {
    const { languages, models, installed, activeDownload, waitingQueue } = this.state

    const activeModels = _.flatten(_.map(_.valuesIn(this.state.active), _.values))
    const languageModels = Object.keys(models).filter(x => models[x].language === code)

    return (
      <div style={{ marginTop: 15 }} key={code}>
        <img src={languages[code].flag} />
        <b>{languages[code].name}</b>

        {languageModels.map(filename => {
          const isInstalled = installed.includes(filename)
          const isActive = activeModels.includes(filename)
          const isQueued = waitingQueue && waitingQueue.find(x => x.filename === filename)
          const isDownloading = activeDownload && activeDownload.filename === filename

          const model = this.state.models[filename]

          return (
            <div style={{ display: 'flex', marginLeft: 39 }} key={filename}>
              <div style={{ width: 300 }}>
                {model.name} ({this.humanFileSize(model.size)})
              </div>

              {this.renderAction(filename, { isInstalled, isActive, isQueued, isDownloading })}
            </div>
          )
        })}
      </div>
    )
  }

  renderActiveDownload({ filename, downloaded, fileSize }) {
    const isStarted = downloaded + fileSize > 0
    const progressPct = Math.round((downloaded / fileSize) * 100)

    return (
      <div>
        <h5>Status</h5>
        <u>Download in progress</u>
        <br />
        <div style={{ padding: 10, textAlign: 'center' }}>{this.state.models[filename].name}</div>
        {isStarted && (
          <React.Fragment>
            <Progress value={progressPct}>{progressPct}%</Progress>
            <div style={{ textAlign: 'center' }}>
              <small>
                ({this.humanFileSize(downloaded)} / {this.humanFileSize(fileSize)})
              </small>
            </div>
          </React.Fragment>
        )}
      </div>
    )
  }

  renderStatus() {
    const { activeDownload, waitingQueue } = this.state

    return (
      <div>
        {activeDownload && this.renderActiveDownload(activeDownload)}
        <br />
        {waitingQueue &&
          !!waitingQueue.length && (
            <div>
              <h5>Queued</h5>

              {waitingQueue.map(x => (
                <div>{x.name}</div>
              ))}
            </div>
          )}
      </div>
    )
  }

  render() {
    if (!this.state.languages) {
      return null
    }

    return (
      <Row>
        {this.state.successMsg && <Alert type="success">{this.state.successMsg}</Alert>}
        <Col md={9}>
          <h4>Language Models</h4>
          <div>
            <p>
              <small>
                Please download the languages you would like your bots to support. They are required for natural
                language understanding. Production models are recommended when you publish your bots.
              </small>
            </p>
            <p>
              <small>
                Models are saved in C:/Users/usernmae/AppData/Roaming/botpress (size: <b>210.24 MB</b>)
              </small>
            </p>
            {Object.keys(this.state.languages).map(lang => this.renderLanguage(lang))}
          </div>

          <br />
        </Col>
        <Col style={{ width: 400 }}> {this.renderStatus()}</Col>
      </Row>
    )
  }
}
