import { Button, FileInput, FormGroup, InputGroup, Menu, MenuItem } from '@blueprintjs/core'
import { ItemRenderer, Select } from '@blueprintjs/select'
import { stat } from 'fs'
import _ from 'lodash'
import React, { Component } from 'react'

import api from '../../../../../ui-admin/src/api'

const statusList = [
  { label: 'Published', value: 'public' },
  { label: 'Collaborators Only', value: 'private' },
  { label: 'Unmounted', value: 'disabled' }
]

class ConfigView extends Component {
  /*
  initialFormState = {
    name: '',
    description: '',
    privacyPolicy: '',
    avatarUrl: '',
    coverPictureUrl: '',
    // category: undefined,
    website: '',
    phoneNumber: '',
    termsConditions: '',
    emailAddress: '',
    status: '',
    selectedLanguages: [],
    selectedDefaultLang: ''
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

    this.initialFormState = {
      name: bot.name || '',
      description: bot.description || '',
      website: bot.details.website || '',
      phoneNumber: bot.details.phoneNumber || '',
      termsConditions: bot.details.termsConditions || '',
      privacyPolicy: bot.details.privacyPolicy || '',
      emailAddress: bot.details.emailAddress || '',
      status,
      selectedLanguages: bot.languages || [],
      selectedDefaultLang: bot.defaultLanguage,
      avatarUrl: bot.details.avatarUrl || '',
      coverPictureUrl: bot.details.coverPictureUrl || ''
    }

    this.setState({
      ...this.initialFormState,
      languages
    })
  }

  async fetchBots() {
    const { data } = await api.getSecured().get('/admin/bots')
    return data.payload.bots
  }

  async fetchLanguages() {
    const { data } = await api.getSecured().get('/admin/languages/available')
    const languages = _.sortBy(data.languages, 'name').map(lang => ({
      label: lang.name,
      value: lang.code
    }))
    return languages
  }

  saveChanges = async () => {
    const bot = {
      name: this.state.name,
      description: this.state.description,
      // category: category && category.value,
      defaultLanguage: this.state.selectedDefaultLang,
      languages: this.state.selectedLanguages,
      details: {
        website: this.state.website,
        phoneNumber: this.state.phoneNumber,
        termsConditions: this.state.termsConditions,
        emailAddress: this.state.emailAddress,
        avatarUrl: this.state.avatarUrl,
        coverPictureUrl: this.state.coverPictureUrl,
        privacyPolicy: this.state.privacyPolicy
      },
      disabled: this.state.status === 'disabled',
      private: this.state.status === 'private'
    }

    await api
      .getSecured()
      .post(`/admin/bots/${this.state.botId}`, bot)
      .catch(err => this.setState({ error: err, isSaving: false }))
  }

  handleInputChanged = event => {
    this.setState({ [event.target.name]: event.target.value })
  }

  handleCommunityLanguageChanged = lang => {
    this.setState({ selectedDefaultLang: lang.target.value, selectedLanguages: [lang.target.value] })
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

  render() {
    const container = {
      maxWidth: '1000px',
      margin: '30px auto'
    }
    const block = {
      display: 'block'
    }
    const languages = []
    for (const lang of this.state.languages) {
      languages.push(
        <option key={lang.value} value={lang.value}>
          {lang.label}
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

    console.log(this.state.avatarUrl)

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
            <div className="bp3-select">
              <select
                id="language"
                name="language"
                value={this.state.selectedLanguages}
                onChange={this.handleCommunityLanguageChanged}
              >
                {languages}
              </select>
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
            <FileInput
              text="Choose file"
              inputProps={{
                id: 'avatarUrl',
                name: 'avatarUrl',
                accept: 'image/*',
                onChange: this.handleImageFileChanged
              }}
            />
            {this.state.avatarUrl !== this.initialFormState.avatarUrl && (
              <p className="configUploadSuccess">
                The bot avatar has been uploaded successfully. You need to save the form in order for the changes to
                take effect.
              </p>
            )}
            {this.state.avatarUrl && <img height={75} style={block} alt="avatar" src={this.state.avatarUrl} />}
          </FormGroup>
          <FormGroup label="Cover Picture" labelFor="cover">
            <FileInput
              text="Choose file"
              inputProps={{
                id: 'coverPictureUrl',
                name: 'coverPictureUrl',
                accept: 'image/*',
                onChange: this.handleImageFileChanged
              }}
            />
            {this.state.coverPictureUrl !== this.initialFormState.coverPictureUrl && (
              <p className="configUploadSuccess">
                The cover picture has been uploaded successfully. You need to save the form in order for the changes to
                take effect.
              </p>
            )}
            {this.state.coverPictureUrl && (
              <img height={200} style={block} className="coverImg" alt="cover" src={this.state.coverPictureUrl} />
            )}
          </FormGroup>
          <Button text="Save changes" intent="primary" icon="floppy-disk" onClick={this.saveChanges} />
        </form>
      </div>
    )
  }
  */
}

export default ConfigView
