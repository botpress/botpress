import React from 'react'
import ReactDOM from 'react-dom'
import {
  Form,
  FormGroup,
  FormControl,
  HelpBlock,
  Col,
  Button,
  ControlLabel,
  Checkbox,
  Radio,
  Glyphicon,
  ListGroup,
  ListGroupItem,
  InputGroup,
  Alert
} from 'react-bootstrap'
import _ from 'lodash'
import Promise from 'bluebird'

import style from './style.scss'

export default class MessengerModule extends React.Component {
  constructor(props) {
    super(props)

    this.state = {
      loading: true,
      message: null,
      error: null,
      users: [],
      matchingUsers: [],
      initialStateHash: null
    }

    this.handleChange = this.handleChange.bind(this)
    this.handleChangeCheckBox = this.handleChangeCheckBox.bind(this)
    this.handleSaveChanges = this.handleSaveChanges.bind(this)
    this.handleRemoveFromList = this.handleRemoveFromList.bind(this)
    this.handleAddToTrustedDomainsList = this.handleAddToTrustedDomainsList.bind(this)
    this.handleAddToPersistentMenuList = this.handleAddToPersistentMenuList.bind(this)
    this.handleValidation = this.handleValidation.bind(this)
    this.handleConnection = this.handleConnection.bind(this)
    this.handlePaymentTesterChange = this.handlePaymentTesterChange.bind(this)
    this.renderPersistentMenuItem = this.renderPersistentMenuItem.bind(this)
    this.renderDomainElement = this.renderDomainElement.bind(this)
    this.renderAutoComplete = this.renderAutoComplete.bind(this)
    this.renderPaymentTesterElement = this.renderPaymentTesterElement.bind(this)
    this.handleDismissError = this.handleDismissError.bind(this)
    this.renderGetStartedMessage = this.renderGetStartedMessage.bind(this)
    this.getPageDetails = this.getPageDetails.bind(this)
  }

  getAxios() {
    return this.props.bp.axios
  }

  componentDidMount() {
    this.getAxios()
      .get('/api/botpress-messenger/config')
      .then(res => {
        this.setState({
          loading: false,
          ...res.data
        })

        setImmediate(() => {
          this.setState({ initialStateHash: this.getStateHash() })
        })
      })

    this.getAxios()
      .get('/api/botpress-messenger/homepage')
      .then(res => {
        this.setState({
          homepage: res.data.homepage
        })
      })

    // get a list of currently available users
    this.getAxios()
      .get('/api/botpress-messenger/users')
      .then(res => {
        this.setState({
          users: res.data
        })
      })
  }

  getStateHash() {
    const hashingStateItems = [
      'accessToken',
      'appSecret',
      'applicationID',
      'automaticallyMarkAsRead',
      'composerInputDisabled',
      'displayGetStarted',
      'greetingMessage',
      'hostname',
      'persistentMenu',
      'persistentMenuItems',
      'targetAudience',
      'targetAudienceOpenToSome',
      'targetAudienceCloseToSome',
      'trustedDomains',
      'paymentTesters',
      'chatExtensionHomeUrl',
      'chatExtensionShowShareButton',
      'chatExtensionInTest'
    ]

    return hashingStateItems
      .map(i => {
        return this.state[i]
      })
      .join(' ')
  }

  handleSaveChanges() {
    this.setState({ loading: true })

    return this.getAxios()
      .post(
        '/api/botpress-messenger/config',
        _.omit(this.state, 'loading', 'initialStateHash', 'message', 'error', 'users', 'matchingUsers', 'pageDetails')
      )
      .then(() => {
        this.setState({
          message: {
            type: 'success',
            text: 'Your configuration have been saved correctly.'
          },
          loading: false,
          initialStateHash: this.getStateHash()
        })
      })
      .catch(err => {
        this.setState({
          message: {
            type: 'danger',
            text: 'An error occured during you were trying to save configuration: ' + err.response.data.message
          },
          loading: false,
          initialStateHash: this.getStateHash()
        })
      })
  }

  handleChange(event) {
    const { name, value } = event.target

    const connectionInputList = ['applicationID', 'accessToken', 'hostname', 'appSecret']
    if (_.includes(connectionInputList, name)) {
      this.setState({ validated: false })
    }

    this.setState({
      [name]: value
    })
  }

  handleValidation() {
    this.getAxios()
      .post('/api/botpress-messenger/validation', {
        applicationID: this.state.applicationID,
        accessToken: this.state.accessToken
      })
      .then(() => {
        this.setState({ validated: true })
      })
      .catch(err => {
        this.setState({ error: err.response.data.message, loading: false })
      })
  }

  // get the page details for the page associated with this access token
  getPageDetails() {
    return this.getAxios()
      .get('/api/botpress-messenger/facebook_page')
      .then(json => {
        this.setState({
          pageDetails: json.data
        })
      })
  }

  handleConnection() {
    let preConnection = Promise.resolve()

    if (this.state.initialStateHash && this.state.initialStateHash !== this.getStateHash()) {
      preConnection = this.handleSaveChanges()
    }

    preConnection.then(() => {
      return this.getAxios()
        .post('/api/botpress-messenger/connection', {
          applicationID: this.state.applicationID,
          accessToken: this.state.accessToken,
          appSecret: this.state.appSecret,
          hostname: this.state.hostname
        })
        .then(() => {
          this.setState({ connected: !this.state.connected })
          window.setTimeout(::this.handleSaveChanges, 100)
        })
        .catch(err => {
          this.setState({ error: err.response.data.message, loading: false })
        })
    })
  }

  handleChangeCheckBox(event) {
    const { name } = event.target
    this.setState({ [name]: !this.state[name] })
  }

  handleRemoveFromList(value, name) {
    this.setState({
      [name]: _.without(this.state[name], value)
    })
  }

  handleAddToTrustedDomainsList() {
    const input = ReactDOM.findDOMNode(this.trustedDomainInput)
    if (input && input.value !== '') {
      this.setState({
        trustedDomains: _.concat(this.state.trustedDomains, input.value)
      })
      input.value = ''
    }
  }

  handleAddToPersistentMenuList() {
    const type = ReactDOM.findDOMNode(this.newPersistentMenuType)
    const title = ReactDOM.findDOMNode(this.newPersistentMenuTitle)
    const value = ReactDOM.findDOMNode(this.newPersistentMenuValue)
    const item = {
      type: type && type.value,
      title: title && title.value,
      value: value && value.value
    }

    if (_.some(_.values(item), _.isEmpty)) {
      return
    }

    this.setState({
      persistentMenuItems: _.concat(this.state.persistentMenuItems, item)
    })

    type.selected = 'postback'
    title.value = ''
    value.value = ''
  }

  handleAddToPaymentTesterList() {
    const input = ReactDOM.findDOMNode(this.paymentTesterInput)
    if (input && input.key !== undefined) {
      // only add the key if it hasn't already been added
      if (this.state.paymentTesters.indexOf(input.key) === -1) {
        this.setState({
          paymentTesters: _.concat(this.state.paymentTesters, input.key)
        })
      }
      input.value = ''

      // clear the matching value state
      this.setState({
        matchingUsers: []
      })
    }
  }

  /*Get a list of users that match what the user is typing in*/
  handlePaymentTesterChange() {
    const input = ReactDOM.findDOMNode(this.paymentTesterInput)
    const matching = []

    // if there is text in the field, update the matching contents
    // we push the indexes only.  It's less space, and we already have the
    // users in a list, so no reason to duplicate
    if (input && input.value !== '') {
      for (const k in this.state.users) {
        const user = this.state.users[k]
        const name = (user.first_name + ' ' + user.last_name).toLowerCase()
        if (name.indexOf(input.value.toLowerCase()) !== -1) {
          matching.push(k)
        }
      }
    }

    // update our state.
    // if there is no input, then this will be an empty list (no matches)
    this.setState({
      matchingUsers: matching
    })
  }

  handleDismissError() {
    this.setState({ error: null })
  }

  renderLabel(label, link) {
    return (
      <Col componentClass={ControlLabel} sm={3}>
        {label}{' '}
        <small>
          (<a target="_blank" href={link}>
            ?
          </a>)
        </small>
      </Col>
    )
  }

  renderTextInput(label, name, link, props = {}) {
    return (
      <FormGroup>
        {this.renderLabel(label, link)}
        <Col sm={7}>
          <FormControl name={name} {...props} type="text" value={this.state[name]} onChange={this.handleChange} />
        </Col>
      </FormGroup>
    )
  }

  renderGetStartedMessage() {
    return (
      <FormGroup>
        {this.renderLabel('Get Started Auto Response?', this.state.homepage + '#display-get-started')}
        <Col sm={7}>
          <Radio
            name="autoResponseOption"
            value="noResponse"
            checked={this.state.autoResponseOption === 'noResponse'}
            onChange={this.handleChange}
          >
            No auto response
          </Radio>
          <Radio
            name="autoResponseOption"
            value="autoResponseText"
            checked={this.state.autoResponseOption === 'autoResponseText'}
            onChange={this.handleChange}
          >
            Text response
          </Radio>
          {this.state.autoResponseOption == 'autoResponseText' && (
            <FormGroup className={style.insideRadioFormGroup}>
              <Col sm={12}>
                <FormControl
                  name="autoResponseText"
                  componentClass="textarea"
                  rows="3"
                  value={this.state['autoResponseText']}
                  onChange={this.handleChange}
                />
                <HelpBlock>
                  Define an auto response text to <em>Get Started</em> postback
                </HelpBlock>
              </Col>
            </FormGroup>
          )}
          <Radio
            name="autoResponseOption"
            value="autoResponsePostback"
            checked={this.state.autoResponseOption === 'autoResponsePostback'}
            onChange={this.handleChange}
          >
            Trigger a postback
          </Radio>
          {this.state.autoResponseOption == 'autoResponsePostback' && (
            <FormGroup className={style.insideRadioFormGroup}>
              <Col sm={12}>
                <FormControl
                  name="autoResponsePostback"
                  type="text"
                  value={this.state['autoResponsePostback']}
                  onChange={this.handleChange}
                />
                <HelpBlock>
                  <strong>{this.state.autoResponsePostback}</strong> postback will be triggered automatically on{' '}
                  <em>Get Started</em> event.
                </HelpBlock>
              </Col>
            </FormGroup>
          )}
        </Col>
      </FormGroup>
    )
  }

  renderHostnameTextInput(props) {
    const prefix = 'https://'
    const suffix = '/api/botpress-messenger/webhook'

    const getValidationState = () => {
      if (this.state.hostname) {
        const expression = /[-a-zA-Z0-9@:%_+.~#?&//=]{2,256}\.[a-z]{2,4}\b(\/[-a-zA-Z0-9@:%_+.~#?&//=]*)?/gi
        const regex = new RegExp(expression)

        const completeURL = prefix + this.state.hostname + suffix
        return regex.test(completeURL) ? 'success' : 'error'
      }
    }

    return (
      <FormGroup validationState={getValidationState()}>
        {this.renderLabel('Hostname', this.state.homepage + '#4-setup-hostname')}
        <Col sm={7}>
          <InputGroup>
            <InputGroup.Addon>{prefix}</InputGroup.Addon>
            <FormControl
              name="hostname"
              {...props}
              type="text"
              value={this.state.hostname}
              onChange={this.handleChange}
            />
            <InputGroup.Addon>{suffix}</InputGroup.Addon>
          </InputGroup>
        </Col>
      </FormGroup>
    )
  }

  renderTextAreaInput(label, name, link, props = {}) {
    return (
      <FormGroup>
        {this.renderLabel(label, link)}
        <Col sm={7}>
          <FormControl
            name={name}
            {...props}
            componentClass="textarea"
            rows="3"
            value={this.state[name]}
            onChange={this.handleChange}
          />
        </Col>
      </FormGroup>
    )
  }

  renderCheckBox(label, name, link) {
    return (
      <FormGroup>
        {this.renderLabel(label, link)}
        <Col sm={7}>
          <Checkbox name={name} checked={this.state[name]} onChange={this.handleChangeCheckBox} />
        </Col>
      </FormGroup>
    )
  }

  renderDomainElement(domain) {
    const removeHandler = () => this.handleRemoveFromList(domain, 'trustedDomains')

    return (
      <ListGroupItem key={domain}>
        {domain}
        <Glyphicon className="pull-right" glyph="remove" onClick={removeHandler} />
      </ListGroupItem>
    )
  }

  renderPaymentTesterElement(tester) {
    const removeHandler = () => {
      this.handleRemoveFromList(tester, 'paymentTesters')
      this.getAxios()
        .post('/api/botpress-messenger/remove_payment_tester', { payment_tester: tester })
        .then(res => {
          console.log(res)
        })
    }

    const user = this.state.users[tester]
    if (user === undefined) {
      return
    }
    return (
      <ListGroupItem key={tester}>
        {user.first_name + ' ' + user.last_name + ' (' + tester + ')'}
        <Glyphicon className="pull-right" glyph="remove" onClick={removeHandler} />
      </ListGroupItem>
    )
  }

  renderAutoComplete(user) {
    const input = ReactDOM.findDOMNode(this.paymentTesterInput)
    const text = user.first_name + ' ' + user.last_name + ' (' + user.id + ')'
    return (
      <ListGroupItem
        key={user.id}
        onClick={() => {
          input.value = text

          input.key = user.id
        }}
      >
        {text}
      </ListGroupItem>
    )
  }

  renderTargetAudience() {
    return (
      <div>
        <FormGroup>
          {this.renderLabel('Target Audience', this.state.homepage + '#target-audience')}
          <Col sm={7}>
            <Radio
              name="targetAudience"
              value="openToAll"
              checked={this.state.targetAudience === 'openToAll'}
              onChange={this.handleChange}
            >
              Open the bot to all users
            </Radio>
            <Radio
              name="targetAudience"
              value="openToSome"
              checked={this.state.targetAudience === 'openToSome'}
              onChange={this.handleChange}
            >
              Open the bot just to some users
            </Radio>
            {this.state.targetAudience == 'openToSome' ? (
              <FormGroup className={style.insideRadioFormGroup}>
                <Col sm={12}>
                  <FormControl
                    name="targetAudienceOpenToSome"
                    componentClass="textarea"
                    rows="3"
                    value={this.state['targetAudienceOpenToSome']}
                    onChange={this.handleChange}
                  />
                  <HelpBlock>
                    Separate countries by commas. You must use a{' '}
                    <a target="_blank" href="https://en.wikipedia.org/wiki/ISO_3166-1#Current_codes">
                      ISO-3361 Alpha 2 code
                    </a>.
                  </HelpBlock>
                </Col>
              </FormGroup>
            ) : null}
            <Radio
              name="targetAudience"
              value="closeToSome"
              checked={this.state.targetAudience === 'closeToSome'}
              onChange={this.handleChange}
            >
              Close the bot just to some users
            </Radio>
            {this.state.targetAudience == 'closeToSome' ? (
              <FormGroup className={style.insideRadioFormGroup}>
                <Col sm={12}>
                  <FormControl
                    name="targetAudienceCloseToSome"
                    componentClass="textarea"
                    rows="3"
                    value={this.state['targetAudienceCloseToSome']}
                    onChange={this.handleChange}
                  />
                  <HelpBlock>
                    Separate countries by commas. You must use a{' '}
                    <a target="_blank" href="https://en.wikipedia.org/wiki/ISO_3166-1#Current_codes">
                      ISO-3361 Alpha 2 code
                    </a>.
                  </HelpBlock>
                </Col>
              </FormGroup>
            ) : null}
            <Radio
              name="targetAudience"
              value="closeToAll"
              checked={this.state.targetAudience === 'closeToAll'}
              onChange={this.handleChange}
            >
              Close the bot to all users
            </Radio>
          </Col>
        </FormGroup>
      </div>
    )
  }

  renderTrustedDomainList() {
    const trustedDomainElements = this.state.trustedDomains.map(this.renderDomainElement)

    return (
      <div>
        <FormGroup>
          {this.renderLabel('Trusted Domains', this.state.homepage + '#trusted-domains')}
          <Col sm={7}>
            <ControlLabel>Current trusted domains:</ControlLabel>
            <ListGroup>{trustedDomainElements}</ListGroup>
          </Col>
        </FormGroup>
        <FormGroup>
          <Col smOffset={3} sm={7}>
            <ControlLabel>Add a new domain:</ControlLabel>
            <FormControl ref={input => (this.trustedDomainInput = input)} type="text" />
            <Button className="bp-button" onClick={() => this.handleAddToTrustedDomainsList()}>
              Add domain
            </Button>
          </Col>
        </FormGroup>
      </div>
    )
  }

  renderPaymentTesters() {
    if (this.state.paymentTesters === undefined) {
      this.state.paymentTesters = []
    }

    const paymentTestersElement = this.state.paymentTesters.map(this.renderPaymentTesterElement)

    const matchingUsers = this.state.matchingUsers.map(idx => this.renderAutoComplete(this.state.users[idx]))
    return (
      <div>
        <FormGroup>
          {this.renderLabel('Payment Testers', this.state.homepage + '#payment-testers')}
          <Col sm={7}>
            <ControlLabel>Current payment testers:</ControlLabel>
            <ListGroup>{paymentTestersElement}</ListGroup>
          </Col>
        </FormGroup>
        <FormGroup>
          <Col smOffset={3} sm={7}>
            <ControlLabel>Add a new payment tester:</ControlLabel>
            <FormControl
              ref={input => (this.paymentTesterInput = input)}
              type="text"
              onChange={this.handlePaymentTesterChange}
            />
            {matchingUsers}
            <Button className="bp-button" onClick={() => this.handleAddToPaymentTesterList()}>
              Add payment tester
            </Button>
          </Col>
        </FormGroup>
      </div>
    )
  }

  /**
   * Render chat extensions options
   *
   * For more info: https://developers.facebook.com/docs/messenger-platform/guides/chat-extensions
   */
  renderChatExtensions() {
    return (
      <div>
        <FormGroup>
          {this.renderLabel('Chat Extensions', this.state.homepage + '#chat-extensions')}
          <Col sm={7}>
            <ControlLabel>Update Home URL</ControlLabel>
            <FormControl
              name="chatExtensionHomeUrl"
              type="text"
              value={this.state.chatExtensionHomeUrl}
              onChange={this.handleChange}
            />
          </Col>
        </FormGroup>
        <FormGroup>
          <Col smOffset={3} sm={2}>
            <ControlLabel>Show Share Button</ControlLabel>
          </Col>
          <Col sm={7}>
            <Checkbox
              name="chatExtensionShowShareButton"
              checked={this.state.chatExtensionShowShareButton}
              onChange={this.handleChangeCheckBox}
            />
          </Col>
        </FormGroup>
        <FormGroup>
          <Col smOffset={3} sm={2}>
            <ControlLabel>Test Mode</ControlLabel>
          </Col>
          <Col sm={7}>
            <Checkbox
              name="chatExtensionInTest"
              checked={this.state.chatExtensionInTest}
              onChange={this.handleChangeCheckBox}
            />
          </Col>
        </FormGroup>
      </div>
    )
  }

  renderPersistentMenuItem(item) {
    const handleRemove = () => this.handleRemoveFromList(item, 'persistentMenuItems')
    return (
      <ListGroupItem key={item.title}>
        {item.type + ' | ' + item.title + ' | ' + item.value}
        <Glyphicon className="pull-right" glyph="remove" onClick={handleRemove} />
      </ListGroupItem>
    )
  }

  renderPersistentMenuList() {
    return (
      <div>
        <FormGroup>
          <Col smOffset={3} sm={7}>
            <ControlLabel>Current menu items:</ControlLabel>
            <ListGroup>{this.state.persistentMenuItems.map(this.renderPersistentMenuItem)}</ListGroup>
          </Col>
        </FormGroup>
        <FormGroup>
          <Col smOffset={3} sm={7}>
            <ControlLabel>Add a new item:</ControlLabel>
            <FormControl ref={r => (this.newPersistentMenuType = r)} componentClass="select" placeholder="postback">
              <option value="postback">Postback</option>
              <option value="url">URL</option>
            </FormControl>
            <FormControl ref={r => (this.newPersistentMenuTitle = r)} type="text" placeholder="Title" />
            <FormControl ref={r => (this.newPersistentMenuValue = r)} type="text" placeholder="Value" />
            <Button className="bp-button" onClick={() => this.handleAddToPersistentMenuList()}>
              Add to menu
            </Button>
          </Col>
        </FormGroup>
      </div>
    )
  }

  renderSaveButton() {
    return (
      <Button className="bp-button" onClick={this.handleSaveChanges}>
        Save
      </Button>
    )
  }

  renderConnectionValidation() {
    const validatedText = <ControlLabel>All your connection settings are valid.</ControlLabel>
    const button = (
      <Button className="bp-button" onClick={this.handleValidation}>
        Validate
      </Button>
    )

    return (
      <FormGroup>
        {this.renderLabel('Validation', this.state.homepage + '#5-validate-and-connect')}
        <Col sm={7}>{this.state.validated ? validatedText : button}</Col>
      </FormGroup>
    )
  }

  renderConnectionButton() {
    const disconnectButton = (
      <Button className="bp-button" onClick={this.handleConnection}>
        Disconnect
      </Button>
    )

    const connectButton = (
      <Button className="bp-button" onClick={this.handleConnection}>
        {this.state.initialStateHash && this.state.initialStateHash !== this.getStateHash()
          ? 'Save & Connect'
          : 'Connect'}
      </Button>
    )

    return (
      <FormGroup>
        <Col smOffset={3} sm={7}>
          {this.state.connected ? disconnectButton : connectButton}
        </Col>
      </FormGroup>
    )
  }

  renderHeader(title) {
    return (
      <div className={style.header}>
        <h4>{title}</h4>
        {this.renderSaveButton()}
      </div>
    )
  }

  renderConfigView() {
    return (
      <FormGroup>
        <Col sm={7} smOffset={3}>
          <Button className="bp-button" href="/api/botpress-messenger/config" download="botpress-messenger.json">
            Download Config
          </Button>
        </Col>
      </FormGroup>
    )
  }

  // render details about the Facebook page that the
  // Access Token is connected to
  // these values are useful when submitting bugs to Facebook
  renderFacebookPageDetails() {
    const content = this.state.pageDetails ? (
      <Col sm={7} smOffset={3}>
        <ControlLabel>Page Name</ControlLabel>
        <FormControl name="fbPageName" type="text" value={this.state.pageDetails.name} disabled="disabled" />
        <ControlLabel>Page ID</ControlLabel>
        <FormControl name="fbPageID" type="text" value={this.state.pageDetails.id} disabled="disabled" />
      </Col>
    ) : (
      <div />
    )

    return (
      <FormGroup>
        {this.renderLabel('Facebook Page Details', '')}
        <Col sm={7}>
          <Button className="bp-button" onClick={this.getPageDetails}>
            Get Facebook Page Details
          </Button>
        </Col>

        {content}
      </FormGroup>
    )
  }

  renderForm() {
    return (
      <Form horizontal>
        <div className={style.section}>
          {this.renderHeader('Connexion')}
          <div>
            {this.renderTextInput(
              'Application ID',
              'applicationID',
              this.state.homepage + '#2-get-app-id-and-app-secret',
              { disabled: this.state.connected }
            )}
            {this.renderTextAreaInput('Access Token', 'accessToken', this.state.homepage + '#3-get-access-token', {
              disabled: this.state.connected
            })}
            {this.renderTextInput('App Secret', 'appSecret', this.state.homepage + '#2-get-app-id-and-app-secret', {
              disabled: this.state.connected
            })}
            {this.renderHostnameTextInput({ disabled: this.state.connected })}
            {this.renderConnectionButton()}
          </div>
        </div>

        <div className={style.section}>
          {this.renderHeader('General')}
          <div>
            {this.renderCheckBox(
              'Display Get Started',
              'displayGetStarted',
              this.state.homepage + '#display-get-started'
            )}
            {this.state.displayGetStarted && this.renderGetStartedMessage()}
            {this.renderTextAreaInput('Greeting text', 'greetingMessage', this.state.homepage + '#greeting-message')}
            {this.renderCheckBox('Persistent menu', 'persistentMenu', this.state.homepage + '#persistent-menu')}
            {this.state.persistentMenu && this.renderPersistentMenuList()}
            {this.renderCheckBox(
              'Automatically mark as read',
              'automaticallyMarkAsRead',
              this.state.homepage + '#automatically-mark-as-read'
            )}
            {this.renderCheckBox(
              'Composer input disabled',
              'composerInputDisabled',
              this.state.homepage + '#composer-input-disabled'
            )}
            {this.renderFacebookPageDetails()}
          </div>
        </div>

        <div className={style.section}>
          {this.renderHeader('Payments')}
          <div>{this.renderPaymentTesters()}</div>
        </div>

        <div className={style.section}>
          {this.renderHeader('Advanced')}
          <div>
            {this.renderTargetAudience()}
            {this.renderTrustedDomainList()}
            {this.renderChatExtensions()}
            {this.renderConfigView()}
          </div>
        </div>
      </Form>
    )
  }

  renderUnsavedAlert() {
    return this.state.initialStateHash && this.state.initialStateHash !== this.getStateHash() ? (
      <Alert bsStyle="warning">Be careful, you have unsaved changes in your configuration...</Alert>
    ) : null
  }

  renderMessageAlert() {
    return this.state.message ? <Alert bsStyle={this.state.message.type}>{this.state.message.text}</Alert> : null
  }

  renderErrorAlert() {
    return (
      <Alert bsStyle="danger" onDismiss={this.handleDismissError}>
        <h4>An error occured during communication with Facebook</h4>
        <p>Details: {this.state.error}</p>
      </Alert>
    )
  }

  renderAllContent() {
    return (
      <div>
        {this.state.error ? this.renderErrorAlert() : null}
        {this.renderUnsavedAlert()}
        {this.renderMessageAlert()}
        {this.renderForm()}
      </div>
    )
  }

  render() {
    return this.state.loading ? null : this.renderAllContent()
  }
}
