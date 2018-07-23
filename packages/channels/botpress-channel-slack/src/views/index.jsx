import React from 'react'

import { Form, FormGroup, FormControl, Col, Button, ControlLabel } from 'react-bootstrap'

import _ from 'lodash'
import axios from 'axios'

import style from './style.scss'

export default class SlackModule extends React.Component {
  constructor(props) {
    super(props)

    this.state = {
      loading: true,
      clientID: '',
      clientSecret: '',
      hostname: '',
      scope: '',
      verificationToken: '',
      botToken: '',
      apiToken: '',
      hashState: null
    }
  }

  componentDidMount() {
    this.fetchConfig().then(() => {
      this.authenticate()
    })
  }

  getAxios = () => this.props.bp.axios
  mApi = (method, url, body) => this.getAxios()[method]('/api/botpress-slack' + url, body)
  mApiGet = (url, body) => this.mApi('get', url, body)
  mApiPost = (url, body) => this.mApi('post', url, body)

  fetchConfig = () => {
    return this.mApiGet('/config').then(({ data }) => {
      this.setState({
        clientID: data.clientID,
        clientSecret: data.clientSecret,
        hostname: data.hostname,
        scope: data.scope,
        apiToken: data.apiToken,
        botToken: data.botToken,
        verificationToken: data.verificationToken,
        loading: false
      })

      setImmediate(() => {
        this.setState({
          hashState: this.getHashState()
        })
      })
    })
  }

  getHashState = () => {
    const values = _.omit(this.state, ['loading', 'hashState'])
    return _.join(_.toArray(values), '_')
  }

  getRedictURI = () => {
    return this.state.hostname + '/modules/channel-slack'
  }

  getOAuthLink = () => {
    return (
      'https://slack.com/oauth/pick' +
      '?client_id=' +
      this.state.clientID +
      '&scope=' +
      this.state.scope +
      '&redirect_uri=' +
      this.getRedictURI()
    )
  }

  getOAuthAccessLink = code => {
    return (
      'https://slack.com/api/oauth.access' +
      '?client_id=' +
      this.state.clientID +
      '&client_secret=' +
      this.state.clientSecret +
      '&code=' +
      code +
      '&redirect_uri=' +
      this.getRedictURI()
    )
  }

  getOAuthTestLink = () => {
    return 'https://slack.com/api/auth.test' + '?token=' + this.state.apiToken
  }

  getParameterByName = name => {
    const url = window.location.href
    name = name.replace(/[\[\]]/g, '\\$&')
    const regex = new RegExp('[?&]' + name + '(=([^&#]*)|&|#|$)'),
      results = regex.exec(url)
    if (!results) {
      return null
    }
    if (!results[2]) {
      return ''
    }
    return decodeURIComponent(results[2].replace(/\+/g, ' '))
  }

  isAuthenticate = () => {
    if (this.state.apiToken === '') {
      return false
    }

    return axios
      .get(this.getOAuthTestLink())
      .then(({ data }) => {
        if (data.ok) {
          return true
        }

        throw new Error('An error occured while testing of your API Token...')
      })
      .catch(err => {
        console.log(err)
        this.setState({
          apiToken: '',
          botToken: ''
        })
        return false
      })
  }

  authenticate = () => {
    const code = this.getParameterByName('code')

    if (!code || this.state.apiToken !== '') {
      return
    }

    axios
      .get(this.getOAuthAccessLink(code))
      .then(({ data }) => {
        if (!data.ok) {
          throw new Error("You encountered an error during authentification, the code doesn't seems to be valid...")
        }

        this.setState({
          apiToken: data.access_token,
          botToken: data.bot.bot_access_token
        })

        setImmediate(() => {
          this.handleSaveConfig()
        })
      })
      .catch(err => {
        console.log(err)
      })
  }

  handleChange = event => {
    const { name, value } = event.target

    this.setState({
      [name]: value
    })
  }

  handleSaveConfig = () => {
    this.mApiPost('/config', {
      clientID: this.state.clientID,
      clientSecret: this.state.clientSecret,
      hostname: this.state.hostname,
      apiToken: this.state.apiToken,
      botToken: this.state.botToken,
      verificationToken: this.state.verificationToken,
      scope: this.state.scope
    })
      .then(({ data }) => {
        this.fetchConfig()
      })
      .catch(err => {
        console.log(err)
      })
  }

  handleReset = () => {
    this.setState({
      apiToken: '',
      botToken: ''
    })

    setImmediate(() => {
      this.setState({ hashState: this.getHashState() })
      this.handleSaveConfig()
    })
  }

  // ----- render functions -----

  renderHeader = title => (
    <div className={style.header}>
      <h4>{title}</h4>
      {this.renderSaveButton()}
    </div>
  )

  renderLabel = label => {
    return (
      <Col componentClass={ControlLabel} sm={3}>
        {label}
      </Col>
    )
  }

  renderInput = (label, name, props = {}) => (
    <FormGroup>
      {this.renderLabel(label)}
      <Col sm={7}>
        <FormControl name={name} {...props} value={this.state[name]} onChange={this.handleChange} />
      </Col>
    </FormGroup>
  )

  renderTextInput = (label, name, props = {}) =>
    this.renderInput(label, name, {
      type: 'text',
      ...props
    })

  renderTextAreaInput = (label, name, props = {}) => {
    return this.renderInput(label, name, {
      componentClass: 'textarea',
      rows: 2,
      ...props
    })
  }

  withNoLabel = element => (
    <FormGroup>
      <Col smOffset={3} sm={7}>
        {element}
      </Col>
    </FormGroup>
  )

  renderBtn = (label, handler) => (
    <Button className={style.formButton} onClick={handler}>
      {label}
    </Button>
  )

  renderLinkButton = (label, link, handler) => (
    <a href={link}>
      <Button className={style.formButton} onClick={handler}>
        {label}
      </Button>
    </a>
  )

  renderAuthentificationButton = () => {
    if (this.isAuthenticate()) {
      return this.withNoLabel(this.renderBtn('Disconnect', this.handleReset))
    }

    return this.withNoLabel(this.renderLinkButton('Authenticate & Connect', this.getOAuthLink(), this.handleSaveConfig))
  }

  renderSaveButton = () => {
    let opacity = 0
    if (this.state.hashState && this.state.hashState !== this.getHashState()) {
      opacity = 1
    }

    return (
      <Button className={style.formButton} style={{ opacity: opacity }} onClick={this.handleSaveConfig}>
        Save
      </Button>
    )
  }

  renderTokenInfo = () => {
    return (
      <div>
        {this.renderTextInput('API token', 'apiToken', {
          disabled: true
        })}

        {this.renderTextInput('Bot token', 'botToken', {
          disabled: true
        })}
      </div>
    )
  }

  renderConfigSection = () => {
    return (
      <div className={style.section}>
        {this.renderHeader('Configuration')}

        {this.renderTextInput('Hostname', 'hostname', {
          placeholder: 'e.g. https://a9f849c4.ngrok.io'
        })}

        {this.renderTextInput('Client ID', 'clientID', {
          placeholder: 'Paste your client id here...'
        })}

        {this.renderTextInput('Client Secret', 'clientSecret', {
          placeholder: 'Paste your client secret here...'
        })}

        {this.renderTextInput('Verification Token', 'verificationToken', {
          placeholder: 'Paste your verification token here...'
        })}

        {this.renderTextInput('Scope', 'scope', {
          placeholder: 'e.g. chat:write:bot,chat:write:user,dnd:read'
        })}

        {this.isAuthenticate() ? this.renderTokenInfo() : null}

        {this.renderAuthentificationButton()}
      </div>
    )
  }

  render() {
    if (this.state.loading) {
      return null
    }

    return (
      <Col md={10} mdOffset={1}>
        <Form horizontal>{this.renderConfigSection()}</Form>
      </Col>
    )
  }
}
