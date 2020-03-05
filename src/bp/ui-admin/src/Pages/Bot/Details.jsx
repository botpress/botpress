import React, { Component, Fragment } from 'react'

import { MdInfoOutline } from 'react-icons/md'
import { connect } from 'react-redux'

import { BotEditSchema } from 'common/validation'
import Joi from 'joi'
import Select from 'react-select'
import { Row, Col, FormGroup, Label, Input, Form, Alert, UncontrolledTooltip, Collapse } from 'reactstrap'
import { MdKeyboardArrowUp, MdKeyboardArrowDown } from 'react-icons/md'
import _ from 'lodash'

import { fetchBots, fetchBotCategories } from '../../reducers/bots'
import { fetchLicensing } from '../../reducers/license'
import { fetchLanguages } from '../../reducers/server'
import { toastSuccess, toastFailure } from '../../utils/toaster'

import api from '../../api'
import PageContainer from '~/App/PageContainer'
import StickyActionBar from '~/App/StickyActionBar'
import { Button, Intent, Callout } from '@blueprintjs/core'
import { confirmDialog } from 'botpress/shared'

const statusList = [
  { label: 'Published', value: 'public' },
  { label: 'Collaborators Only', value: 'private' },
  { label: 'Unmounted', value: 'disabled' }
]

class Bots extends Component {
  initialFormState = {
    name: '',
    description: '',
    privacyPolicy: '',
    avatarUrl: '',
    coverPictureUrl: '',
    category: undefined,
    website: '',
    phoneNumber: '',
    termsConditions: '',
    emailAddress: ''
  }

  state = {
    id: '',
    ...this.initialFormState,
    error: undefined,
    categories: [],
    moreOpen: false,
    languages: [],
    defaultLanguage: undefined,
    isSaving: false
  }

  componentDidMount() {
    if (!this.props.botCategoriesFetched) {
      this.props.fetchBotCategories()
    }

    if (!this.props.licensing) {
      this.props.fetchLicensing()
    }

    if (!this.props.languages) {
      this.props.fetchLanguages()
    }

    this.props.fetchBots()
    this.prepareCategories()
  }

  componentDidUpdate(prevProps) {
    if (prevProps.bots !== this.props.bots) {
      this.loadBot()
    }
    if (prevProps.botCategories !== this.props.botCategories) {
      this.prepareCategories()
    }
    if (prevProps.languages !== this.props.languages) {
      this.updateLanguages()
    }
  }

  prepareCategories = () => {
    if (this.props.botCategories) {
      this.setState({ categories: this.props.botCategories.map(cat => ({ label: cat, value: cat })) })
    }
  }

  updateLanguages = () => {
    if (!this.props.languages) {
      return
    }

    const languagesList = _.sortBy(this.props.languages, 'name').map(lang => ({
      label: lang.name,
      value: lang.code
    }))

    this.setState({
      languagesList,
      selectedLanguages: languagesList.filter(x => (this.state.languages || []).includes(x.value)),
      selectedDefaultLang: languagesList.find(x => x.value === this.state.defaultLanguage)
    })
  }

  loadBot() {
    const botId = this.props.match.params.botId
    this.bot = this.props.bots.find(bot => bot.id === botId)

    const status = this.bot.disabled ? 'disabled' : this.bot.private ? 'private' : 'public'
    const details = _.get(this.bot, 'details', {})

    this.initialFormState = {
      name: this.bot.name || '',
      description: this.bot.description || '',
      website: details.website || '',
      phoneNumber: details.phoneNumber || '',
      termsConditions: details.termsConditions || '',
      privacyPolicy: details.privacyPolicy || '',
      emailAddress: details.emailAddress || '',
      status: statusList.find(x => x.value === status),
      category: this.state.categories.find(x => x.value === this.bot.category),
      avatarUrl: details.avatarUrl || '',
      coverPictureUrl: details.coverPictureUrl || '',
      selectedLanguages: this.bot.languages || [],
      selectedDefaultLang: this.bot.defaultLanguage
    }

    this.setState(
      {
        botId,
        ...this.initialFormState,
        languages: this.bot.languages || [],
        defaultLanguage: this.bot.defaultLanguage
      },
      this.updateLanguages
    )
  }

  cancel = async () => {
    const currentFormState = {
      name: this.state.name,
      description: this.state.description,
      website: this.state.website,
      phoneNumber: this.state.phoneNumber,
      termsConditions: this.state.termsConditions,
      privacyPolicy: this.state.privacyPolicy,
      emailAddress: this.state.emailAddress,
      status: this.state.status,
      category: this.state.category,
      avatarUrl: this.state.avatarUrl,
      coverPictureUrl: this.state.coverPictureUrl,
      selectedLanguages: this.state.selectedLanguages.map(x => x.value),
      selectedDefaultLang: this.state.selectedDefaultLang.value
    }

    if (
      JSON.stringify(this.initialFormState) !== JSON.stringify(currentFormState) &&
      !(await confirmDialog('There are unsaved changes in this form. Are you sure you want to cancel?', {
        acceptLabel: 'Cancel',
        declineLabel: 'Continue editing'
      }))
    ) {
      return
    }
    this.backToList()
  }

  backToList = () => {
    this.props.history.push('/workspace/')
  }

  saveChanges = async () => {
    this.setState({ error: undefined, isSaving: true })

    const { selectedLanguages, selectedDefaultLang, category } = this.state

    const bot = {
      name: this.state.name,
      description: this.state.description,
      category: category && category.value,
      defaultLanguage: selectedDefaultLang && selectedDefaultLang.value,
      languages: selectedLanguages && selectedLanguages.map(x => x.value),
      details: {
        website: this.state.website,
        phoneNumber: this.state.phoneNumber,
        termsConditions: this.state.termsConditions,
        emailAddress: this.state.emailAddress,
        avatarUrl: this.state.avatarUrl,
        coverPictureUrl: this.state.coverPictureUrl,
        privacyPolicy: this.state.privacyPolicy
      }
    }

    const status = this.state.status && this.state.status.value
    bot.disabled = status === 'disabled' && bot.defaultLanguage === this.bot.defaultLanguage //force enable if language changed
    bot.private = status === 'private'

    const { error } = Joi.validate(bot, BotEditSchema)
    if (error) {
      toastFailure('The form contains errors')
      this.setState({ error: error, isSaving: false })
      return
    }

    await api
      .getSecured()
      .post(`/admin/bots/${this.state.botId}`, bot)
      .catch(err => this.setState({ error: err, isSaving: false }))

    await this.props.fetchBots()

    toastSuccess('Bot configuration updated successfully')
    this.backToList()
  }

  toggleMoreOpen = () => {
    this.setState({
      moreOpen: !this.state.moreOpen
    })
  }

  renderHelp(text, id) {
    return (
      <span>
        <MdInfoOutline id={`help${id}`} className="section-title-help" />
        <UncontrolledTooltip placement="right" target={`help${id}`}>
          {text}
        </UncontrolledTooltip>
      </span>
    )
  }

  handleInputChanged = event => this.setState({ [event.target.name]: event.target.value })
  handleStatusChanged = status => this.setState({ status })
  handleCategoryChanged = category => this.setState({ category })

  handleDefaultLangChanged = async lang => {
    if (!this.state.selectedDefaultLang) {
      this.setState({ selectedDefaultLang: lang })
      return
    }

    if (this.state.selectedDefaultLang !== lang) {
      const conf = await confirmDialog(
        `Are you sure you want to change the language of your bot from ${this.state.selectedDefaultLang.label} to ${lang.label}? All of your content elements will be copied, make sure you translate them.`,
        {
          acceptLabel: 'Change'
        }
      )

      if (conf) {
        this.setState({ selectedDefaultLang: lang })
      }
    }
  }

  handleLanguagesChanged = langs => {
    this.setState({ selectedLanguages: langs })
  }

  handleCommunityLanguageChanged = lang => {
    this.setState({ selectedDefaultLang: lang, selectedLanguages: [lang] })
  }

  handleImageFileChanged = async event => {
    const targetProp = event.target.name
    if (!event.target.files) {
      return
    }

    if (!event.target.files[0].type.includes('image/')) {
      this.setState({
        error: `${targetProp} requires an image file`
      })
      return
    }

    const data = new FormData()
    data.append('file', event.target.files[0])

    if (this.state.error) {
      this.setState({ error: null })
    }

    await api
      .getSecured()
      .post(`/bots/${this.state.botId}/media`, data, { headers: { 'Content-Type': 'multipart/form-data' } })
      .then(response => {
        this.setState({ [targetProp]: response.data.url })
      })
      .catch(err => {
        this.setState({ error: err })
      })
  }

  renderLanguages = () => {
    if (this.props.licensing && this.props.licensing.isPro) {
      return (
        <Row>
          <Col md={6}>
            <FormGroup>
              <Label for="sup-lang">
                <strong>Supported Languages</strong>
                {this.renderHelp('Your bot can support different languages, select desired languages', 'sup-lang')}
              </Label>
              <Select
                options={this.state.languagesList}
                isMulti
                value={this.state.selectedLanguages}
                onChange={this.handleLanguagesChanged}
              />
            </FormGroup>
          </Col>
          <Col md={6}>
            <FormGroup>
              <Label>
                <strong>Default language</strong>
                {this.renderHelp(
                  'Choose the default language for your bot. First of supported language is picked by default.',
                  'def-lang'
                )}
              </Label>
              <Select
                options={this.state.languagesList}
                value={this.state.selectedDefaultLang}
                onChange={this.handleDefaultLangChanged}
              />
            </FormGroup>
          </Col>
        </Row>
      )
    } else {
      return (
        <FormGroup>
          <Label for="sup-lang">
            <strong>Language</strong>
            {this.renderHelp('Choose desired language among those', 'sup-lang')}
          </Label>
          <Select
            options={this.state.languagesList}
            value={this.state.selectedLanguages}
            onChange={this.handleCommunityLanguageChanged}
          />
        </FormGroup>
      )
    }
  }

  renderDetails() {
    const { categories, category, description, error, name, status } = this.state
    return (
      <div>
        {error && <Alert color="danger">{error.message}</Alert>}
        <Form>
          <Row form>
            <Col md={5}>
              <FormGroup>
                <Label for="name">
                  <strong>Name</strong>
                </Label>
                <Input id="input-name" type="text" name="name" value={name} onChange={this.handleInputChanged} />
              </FormGroup>
            </Col>
            <Col md={4}>
              {!!categories.length && (
                <FormGroup>
                  <Label>
                    <strong>Category</strong>
                  </Label>
                  <Select
                    id="select-category"
                    options={categories}
                    value={category}
                    onChange={this.handleCategoryChanged}
                  />
                </FormGroup>
              )}
            </Col>
            <Col md={3}>
              <FormGroup>
                <Label for="status">
                  <strong>Status</strong>
                  {this.renderHelp(
                    `Public bots can be accessed by anyone, while private are only accessible by authenticated users.
                Please note that private bots cannot be embedded on a website.
                This should only be used for testing purposes while developing or if you access it directly using shortlinks`
                  )}
                </Label>
                <Select
                  id="select-status"
                  options={statusList}
                  value={status}
                  onChange={this.handleStatusChanged}
                  isSearchable={false}
                />
              </FormGroup>
            </Col>
          </Row>
          <FormGroup>
            <Label for="description">
              <strong>Description</strong>
            </Label>
            <Input
              id="input-description"
              type="textarea"
              name="description"
              value={description}
              onChange={this.handleInputChanged}
            />
          </FormGroup>
          {this.renderLanguages()}
        </Form>

        {this.renderCollapsible()}
      </div>
    )
  }

  renderMoreDetails() {
    return (
      <Fragment>
        <Row form>
          <Col md={4}>
            <FormGroup>
              <Label for="website">
                <strong>Website</strong>
              </Label>
              <Input
                id="input-website"
                type="text"
                name="website"
                value={this.state.website}
                onChange={this.handleInputChanged}
              />
            </FormGroup>
          </Col>
          <Col md={4}>
            <FormGroup>
              <Label for="phoneNumber">
                <strong>Phone Number</strong>
              </Label>
              <Input
                id="input-phone"
                type="text"
                name="phoneNumber"
                value={this.state.phoneNumber}
                onChange={this.handleInputChanged}
              />
            </FormGroup>
          </Col>
          <Col md={4}>
            <FormGroup>
              <Label for="emailAddress">
                <strong>Contact E-mail</strong>
              </Label>
              <Input
                id="input-email"
                type="text"
                name="emailAddress"
                value={this.state.emailAddress}
                onChange={this.handleInputChanged}
              />
            </FormGroup>
          </Col>
        </Row>
        <Row form>
          <Col md={6}>
            <FormGroup>
              <Label for="termsConditions">
                <strong>Link to Terms & Conditions</strong>
              </Label>
              <Input
                id="input-termsConditions"
                type="text"
                name="termsConditions"
                value={this.state.termsConditions}
                onChange={this.handleInputChanged}
              />
            </FormGroup>
          </Col>
          <Col md={6}>
            <FormGroup>
              <Label for="termsConditions">
                <strong>Link to Privacy Policy</strong>
              </Label>
              <Input
                type="text"
                id="input-privacyPolicy"
                name="privacyPolicy"
                value={this.state.privacyPolicy}
                onChange={this.handleInputChanged}
              />
            </FormGroup>
          </Col>
        </Row>
        <small>
          This information is displayed on the Bot Information page,{' '}
          <a href="https://botpress.com/docs/tutorials/webchat-embedding" target="_blank" rel="noopener noreferrer">
            check the documentation for more details
          </a>
        </small>
      </Fragment>
    )
  }

  renderPictures() {
    // [TODO] max.cloutier 2020.01.17 functional, but the style of this section should be revisited
    return (
      <Fragment>
        <Row>
          <Col md={6}>
            <Label>
              <strong>Bot Avatar</strong>
            </Label>
            <Input type="file" accept="image/*" name="avatarUrl" onChange={this.handleImageFileChanged} />
            {this.state.avatarUrl !== this.initialFormState.avatarUrl && (
              <p className="configUploadSuccess">
                The bot avatar has been uploaded successfully. You need to save the form in order for the changes to
                take effect.
              </p>
            )}
            {this.state.avatarUrl && <img height={75} alt="avatar" src={this.state.avatarUrl} />}
          </Col>
          <Col md={6}>
            <Label>
              <strong>Cover Picture</strong>
            </Label>
            <Input type="file" accept="image/*" name="coverPictureUrl" onChange={this.handleImageFileChanged} />
            {this.state.coverPictureUrl !== this.initialFormState.coverPictureUrl && (
              <p className="configUploadSuccess">
                The cover picture has been uploaded successfully. You need to save the form in order for the changes to
                take effect.
              </p>
            )}
            {this.state.coverPictureUrl && <img className="coverImg" alt="cover" src={this.state.coverPictureUrl} />}
          </Col>
        </Row>
      </Fragment>
    )
  }

  renderCollapsible() {
    return (
      <div className="bp_users-container">
        <div>
          <div
            onClick={() => this.setState({ moreCollapsed: !this.state.moreCollapsed })}
            className="bp_users-role_header"
          >
            <div className="role float-left">
              <span className="title">More details</span>
            </div>
            {this.state.moreCollapsed ? <MdKeyboardArrowUp /> : <MdKeyboardArrowDown />}
          </div>
        </div>

        <Collapse isOpen={this.state.moreCollapsed}>
          <div style={{ padding: 15 }}>{this.renderMoreDetails()}</div>
        </Collapse>

        <div>
          <div
            onClick={() => this.setState({ avatarCollapsed: !this.state.avatarCollapsed })}
            className="bp_users-role_header"
          >
            <div className="role float-left">
              <span className="title">Pictures</span>
            </div>
            {this.state.avatarCollapsed ? <MdKeyboardArrowUp /> : <MdKeyboardArrowDown />}
          </div>
        </div>

        <Collapse isOpen={this.state.avatarCollapsed}>
          <div style={{ padding: 15 }}>{this.renderPictures()}</div>
        </Collapse>
      </div>
    )
  }

  render() {
    return (
      <PageContainer
        contentClassName="with-sticky-action-bar"
        title={`Bot - ${this.state.name || this.state.botId}`}
        helpText="This page shows the details you can configure for a desired bot."
      >
        <Callout title="This menu is moving" intent="warning">
          This menu will be permanently moving to <a href={`studio/${this.state.botId}/config`}>the studio.</a>
        </Callout>
        {this.renderDetails()}
        <StickyActionBar>
          <Button
            id="btn-cancel"
            intent={Intent.NONE}
            text="Cancel"
            disabled={this.state.isSaving}
            onClick={this.cancel}
          />
          <Button
            id="btn-save"
            intent={Intent.PRIMARY}
            icon="floppy-disk"
            text="Save changes"
            disabled={this.state.isSaving}
            onClick={this.saveChanges}
          />
        </StickyActionBar>
      </PageContainer>
    )
  }
}

const mapStateToProps = state => ({
  bots: state.bots.bots,
  botCategories: state.bots.botCategories,
  botCategoriesFetched: state.bots.botCategoriesFetched,
  licensing: state.license.licensing,
  languages: state.server.languages
})

const mapDispatchToProps = {
  fetchBots,
  fetchBotCategories,
  fetchLicensing,
  fetchLanguages
}

export default connect(mapStateToProps, mapDispatchToProps)(Bots)
