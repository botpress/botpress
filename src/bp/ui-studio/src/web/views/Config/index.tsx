import { Button, FileInput, FormGroup, InputGroup, Menu, MenuItem } from '@blueprintjs/core'
import { ItemRenderer, Select } from '@blueprintjs/select'
import React, { Component } from 'react'

import api from '../../../../../ui-admin/src/api'

const statusList = [
  { label: 'Published', value: 'public' },
  { label: 'Collaborators Only', value: 'private' },
  { label: 'Unmounted', value: 'disabled' }
]

class ConfigView extends Component {
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
    emailAddress: '',
    status: ''
  }

  state = {
    botId: window.BOT_ID,
    id: '',
    ...this.initialFormState,
    error: undefined,
    languages: []
  }

  async componentDidMount() {
    const bots = await this.fetchBots()
    const languages = await this.fetchLanguages()
    const bot = bots.find(x => x.id === this.state.botId)

    const status = bot.disabled ? 'disabled' : bot.private ? 'private' : 'public'

    const details = bot.details
    this.setState({
      name: bot.name || '',
      description: bot.description || '',
      website: details.website || '',
      phoneNumber: details.phoneNumber || '',
      termsConditions: details.termsConditions || '',
      privacyPolicy: details.privacyPolicy || '',
      emailAddress: details.emailAddress || '',
      status: statusList.find(x => x.value === status),
      languages
      // status: statusList.find(x => x.value === status),
      // category: this.state.categories.find(x => x.value === this.bot.category),
      // avatarUrl: details.avatarUrl || '',
      // coverPictureUrl: details.coverPictureUrl || ''
      // selectedLanguages: this.bot.languages || [],
      // selectedDefaultLang: this.bot.defaultLanguage
    })
  }

  handleInputChanged = event => {
    this.setState({ [event.target.name]: event.target.value })
  }

  async fetchBots() {
    const { data } = await api.getSecured().get('/admin/bots')
    return data.payload.bots
  }

  async fetchLanguages() {
    const { data } = await api.getSecured().get('/admin/languages/available')
    return data.languages
  }

  saveChanges = async () => {
    const bot = {
      name: this.state.name,
      description: this.state.description,
      // category: category && category.value,
      // defaultLanguage: selectedDefaultLang && selectedDefaultLang.value,
      // languages: selectedLanguages && selectedLanguages.map(x => x.value),
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

    bot.disabled = this.state.status === 'disabled' // && bot.defaultLanguage === this.bot.defaultLanguage // force enable if language changed
    bot.private = this.state.status === 'private'
    console.log(`disabled: ${bot.disabled}`)
    console.log(`private: ${bot.private}`)

    await api
      .getSecured()
      .post(`/admin/bots/${this.state.botId}`, bot)
      .catch(err => this.setState({ error: err, isSaving: false }))
  }

  render() {
    const container = {
      maxWidth: '1000px',
      margin: '30px auto'
    }
    const languages = []
    for (const lang of this.state.languages) {
      languages.push(
        <option key={lang.code} value={lang.code}>
          {lang.name}
        </option>
      )
    }
    const statuses = []
    for (const status of statusList) {
      statuses.push(
        <option key={status.value} value={status.value}>
          {status.label}
        </option>
      )
    }
    return (
      <div style={container}>
        <form>
          <FormGroup label="Name" labelFor="name">
            <InputGroup id="name" name="name" value={this.state.name} onChange={this.handleInputChanged} />
          </FormGroup>
          <FormGroup label="Status" labelFor="status">
            <div className="bp3-select">
              <select id="status" name="status" value={this.state.status} onChange={this.handleInputChanged}>
                {statuses}
              </select>
            </div>
          </FormGroup>
          <FormGroup label="Description" labelFor="description">
            <InputGroup
              id="description"
              name="description"
              value={this.state.description}
              onChange={this.handleInputChanged}
            />
          </FormGroup>
          <FormGroup label="Language" labelFor="language">
            <div id="language" className="bp3-select">
              <select>{languages}</select>
            </div>
          </FormGroup>
          <FormGroup label="Website" labelFor="website">
            <InputGroup id="website" name="website" value={this.state.website} onChange={this.handleInputChanged} />
          </FormGroup>
          <FormGroup label="Phone Number" labelFor="phone-number">
            <InputGroup
              id="phone-number"
              name="phoneNumber"
              value={this.state.phoneNumber}
              onChange={this.handleInputChanged}
            />
          </FormGroup>
          <FormGroup label="Contact E-mail" labelFor="contact-email">
            <InputGroup
              id="contact-email"
              name="emailAddress"
              value={this.state.emailAddress}
              onChange={this.handleInputChanged}
            />
          </FormGroup>
          <FormGroup label="Link to Terms &amp; Conditions" labelFor="terms-and-conditions">
            <InputGroup
              id="terms-and-conditions"
              name="termsConditions"
              value={this.state.termsConditions}
              onChange={this.handleInputChanged}
            />
          </FormGroup>
          <FormGroup label="Link to Privacy Policy" labelFor="privacy-policy">
            <InputGroup
              id="privacy-policy"
              name="privacyPolicy"
              value={this.state.privacyPolicy}
              onChange={this.handleInputChanged}
            />
          </FormGroup>
          <FormGroup label="Bot Avatar" labelFor="avatar">
            <FileInput id="avatar" text="Choose file" />
          </FormGroup>
          <FormGroup label="Cover Picture" labelFor="cover">
            <FileInput id="cover" text="Choose file" />
          </FormGroup>
          <Button text="Save changes" intent="primary" icon="floppy-disk" onClick={this.saveChanges} />
        </form>
      </div>
    )
  }

  itemRenderer(item) {
    return <MenuItem key={item} text={item} />
  }
}

export default ConfigView
