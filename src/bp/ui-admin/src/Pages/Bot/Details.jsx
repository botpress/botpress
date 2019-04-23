import React, { Component, Fragment } from 'react'

import { MdInfoOutline } from 'react-icons/lib/md'
import { connect } from 'react-redux'

import { BotEditSchema } from 'common/validation'
import Joi from 'joi'
import Select from 'react-select'
import { Row, Col, Button, FormGroup, Label, Input, Form, Alert, UncontrolledTooltip, Collapse } from 'reactstrap'
import { MdKeyboardArrowUp, MdKeyboardArrowDown } from 'react-icons/lib/md'
import _ from 'lodash'

import { fetchBots, fetchBotCategories } from '../../reducers/bots'
import { fetchLicensing } from '../../reducers/license'
import { fetchLanguages } from '../../reducers/server'

import SectionLayout from '../Layouts/Section'

import api from '../../api'

const statusList = [
  { label: 'Public', value: 'public' },
  { label: 'Private', value: 'private' },
  { label: 'Disabled', value: 'disabled' }
]

class Bots extends Component {
  state = {
    id: '',
    name: '',
    avatarUrl: '',
    coverPictureUrl: '',
    category: undefined,
    description: '',
    website: '',
    phoneNumber: '',
    termsConditions: '',
    emailAddress: '',
    error: undefined,
    categories: [],
    moreOpen: false,
    languages: [],
    defaultLanguage: undefined
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

    const languagesList = this.props.languages.map(lang => ({
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

    this.setState(
      {
        botId,
        name: this.bot.name,
        description: this.bot.description,
        languages: this.bot.languages || [],
        defaultLanguage: this.bot.defaultLanguage,
        website: details.website,
        phoneNumber: details.phoneNumber,
        termsConditions: details.termsConditions,
        privacyPolicy: details.privacyPolicy,
        emailAddress: details.emailAddress,
        status: statusList.find(x => x.value === status),
        category: this.state.categories.find(x => x.value === this.bot.category),
        avatarUrl: details.avatarUrl || '',
        coverPictureUrl: details.coverPictureUrl || ''
      },
      this.updateLanguages
    )
  }

  saveChanges = async () => {
    this.setState({ error: undefined })

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
      this.setState({ error: error })
      return
    }

    await api
      .getSecured()
      .put(`/admin/bots/${this.state.botId}`, bot)
      .catch(err => this.setState({ error: err }))

    await this.props.fetchBots()

    this.setState({ successMsg: `Bot configuration updated successfully` })

    window.setTimeout(() => {
      this.setState({ successMsg: undefined })
    }, 2000)
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

  handleDefaultLangChanged = lang => {
    if (!this.state.selectedDefaultLang) {
      this.setState({ selectedDefaultLang: lang })
      return
    }

    if (this.state.selectedDefaultLang !== lang) {
      const conf = window.confirm(
        `Are you sure you want to change the language of your bot from ${this.state.selectedDefaultLang.label} to ${
          lang.label
        }? All of your content elements will be copied, make sure you translate them.`
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
        this.setState({ [targetProp]: response.data.url }, this.saveChanges)
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
    return (
      <div>
        {this.state.error && <Alert color="danger">{this.state.error.message}</Alert>}
        {this.state.successMsg && <Alert type="success">{this.state.successMsg}</Alert>}
        <Form>
          <Row form>
            <Col md={5}>
              <FormGroup>
                <Label for="name">
                  <strong>Name</strong>
                </Label>
                <Input type="text" name="name" value={this.state.name} onChange={this.handleInputChanged} />
              </FormGroup>
            </Col>
            <Col md={4}>
              {!!this.state.categories.length && (
                <FormGroup>
                  <Label>
                    <strong>Category</strong>
                  </Label>
                  <Select
                    options={this.state.categories}
                    value={this.state.category}
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
                  options={statusList}
                  value={this.state.status}
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
              type="textarea"
              name="description"
              value={this.state.description}
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
              <Input type="text" name="website" value={this.state.website} onChange={this.handleInputChanged} />
            </FormGroup>
          </Col>
          <Col md={4}>
            <FormGroup>
              <Label for="phoneNumber">
                <strong>Phone Number</strong>
              </Label>
              <Input type="text" name="phoneNumber" value={this.state.phoneNumber} onChange={this.handleInputChanged} />
            </FormGroup>
          </Col>
          <Col md={4}>
            <FormGroup>
              <Label for="emailAddress">
                <strong>Contact E-mail</strong>
              </Label>
              <Input
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
                name="privacyPolicy"
                value={this.state.privacyPolicy}
                onChange={this.handleInputChanged}
              />
            </FormGroup>
          </Col>
        </Row>
        <small>
          These informations are displayed on the Bot Information page,{' '}
          <a href="https://botpress.io/docs/tutorials/webchat-embedding" target="_blank" rel="noopener noreferrer">
            check the documentation for more details
          </a>
        </small>
      </Fragment>
    )
  }

  renderPictures() {
    return (
      <Fragment>
        <Row>
          <Col md={7}>
            <Label>
              <strong>Bot Avatar</strong>
            </Label>
            <Input type="file" accept="image/*" name="avatarUrl" onChange={this.handleImageFileChanged} />
          </Col>
          <Col md={4}>{this.state.avatarUrl && <img height={75} alt="avatar" src={this.state.avatarUrl} />}</Col>
        </Row>
        <Row>
          <Col md={4}>
            <Label>
              <strong>Cover Picture</strong>
            </Label>
            <Input type="file" accept="image/*" name="coverPictureUrl" onChange={this.handleImageFileChanged} />
          </Col>
          <Col md={8}>
            {this.state.coverPictureUrl && <img width="100%" alt="cover" src={this.state.coverPictureUrl} />}
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
      <SectionLayout
        title={this.state.name || this.state.botId}
        helpText="This page shows the details you can configure for a desired bot."
        activePage="bots"
        currentTeam={this.props.team}
        mainContent={this.renderDetails()}
        sideMenu={
          <Button color="primary" onClick={this.saveChanges}>
            Save Details
          </Button>
        }
      />
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

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(Bots)
