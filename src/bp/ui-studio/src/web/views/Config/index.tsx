import { Button, Callout, Card, Collapse, Elevation, FileInput, FormGroup, InputGroup } from '@blueprintjs/core'
import axios from 'axios'
import { any } from 'bluebird'
import { BotEditSchema } from 'common/validation'
import Joi from 'joi'
import _ from 'lodash'
import React, { Component } from 'react'
import Select from 'react-select'
import confirmDialog from '~/components/Shared/ConfirmDialog'
import { toastFailure, toastSuccess } from '~/components/Shared/Utils/Toaster'

import style from './style.scss'

const statusList = [
  { label: 'Published', value: 'public' },
  { label: 'Collaborators Only', value: 'private' },
  { label: 'Unmounted', value: 'disabled' }
]

class ConfigView extends Component {
  initialFormState = {
    name: '',
    status: '',
    description: '',
    selectedDefaultLang: '',
    selectedLanguages: [],
    website: '',
    phoneNumber: '',
    emailAddress: '',
    termsConditions: '',
    privacyPolicy: '',
    avatarUrl: '',
    coverPictureUrl: ''
  }

  state = {
    botId: window.BOT_ID,
    ...this.initialFormState,
    licensing: any,
    languages: [],
    statuses: statusList,
    error: undefined,
    isSaving: false,
    isDetailsOpen: false,
    isPicturesOpen: false
  }

  async componentDidMount() {
    const bots = await this.fetchBots()
    const languages = await this.fetchLanguages()
    const licensing = await this.fetchLicensing()

    const bot = bots.find(x => x.id === this.state.botId)
    const status = bot.disabled ? 'disabled' : bot.private ? 'private' : 'public'

    this.initialFormState = {
      name: bot.name || '',
      status,
      description: bot.description || '',
      selectedDefaultLang: bot.defaultLanguage,
      selectedLanguages: languages.filter(x => bot.languages.includes(x.value)),
      website: bot.details.website || '',
      phoneNumber: bot.details.phoneNumber || '',
      emailAddress: bot.details.emailAddress || '',
      termsConditions: bot.details.termsConditions || '',
      privacyPolicy: bot.details.privacyPolicy || '',
      avatarUrl: bot.details.avatarUrl || '',
      coverPictureUrl: bot.details.coverPictureUrl || ''
    }

    this.setState({
      ...this.initialFormState,
      licensing,
      languages
    })
  }

  async fetchBots() {
    const res = await axios.get('api/v1/admin/bots')
    return res.data.payload.bots
  }

  async fetchLanguages() {
    const { data } = await axios.get('api/v1/admin/languages/available')
    const languages = _.sortBy(data.languages, 'name').map(lang => ({
      label: lang.name,
      value: lang.code
    }))
    return languages
  }

  async fetchLicensing() {
    const { data } = await axios.get('api/v1/admin/license/status')
    return data.payload
  }

  saveChanges = async () => {
    this.setState({ error: undefined, isSaving: true })

    const bot = {
      name: this.state.name,
      disabled: this.state.status === 'disabled',
      private: this.state.status === 'private',
      description: this.state.description,
      defaultLanguage: this.state.selectedDefaultLang,
      languages: this.state.selectedLanguages.map(x => x.value),
      details: {
        website: this.state.website,
        phoneNumber: this.state.phoneNumber,
        emailAddress: this.state.emailAddress,
        termsConditions: this.state.termsConditions,
        privacyPolicy: this.state.privacyPolicy,
        avatarUrl: this.state.avatarUrl,
        coverPictureUrl: this.state.coverPictureUrl
      }
    }

    const { error } = Joi.validate(bot, BotEditSchema)
    if (error) {
      toastFailure('The form contains errors')
      this.setState({ error: error, isSaving: false })
      return
    }

    try {
      await axios.post(`api/v1/admin/bots/${this.state.botId}`, bot)
      toastSuccess('Bot configuration updated successfully')
      this.setState({ error: undefined, isSaving: false })
    } catch (err) {
      this.setState({ error: err, isSaving: false })
    }
  }

  handleInputChanged = event => {
    this.setState({ [event.target.name]: event.target.value })
  }

  handleDefaultLangChanged = async event => {
    const lang = event.target.value

    if (!this.state.selectedDefaultLang) {
      this.setState({ selectedDefaultLang: lang })
      return
    }

    if (this.state.selectedDefaultLang !== lang) {
      const currentName = this.state.languages.find(x => x.value === this.state.selectedDefaultLang).label
      const newName = this.state.languages.find(x => x.value === lang).label
      const conf = await confirmDialog(
        `Are you sure you want to change the language of your bot from ${currentName} to ${newName}? All of your content elements will be copied, make sure you translate them.`,
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

  handleCommunityLanguageChanged = event => {
    this.setState({ selectedDefaultLang: event.target.value, selectedLanguages: [{ value: event.target.value }] })
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

    try {
      const res = await axios.post(`api/v1/bots/${this.state.botId}/media`, data, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })
      this.setState({ [targetProp]: res.data.url })
    } catch (err) {
      this.setState({ error: err })
    }
  }

  handleDetailsCollapseClick = () => {
    this.setState({ isDetailsOpen: !this.state.isDetailsOpen })
  }

  handlePicturesCollapseClick = () => {
    this.setState({ isPicturesOpen: !this.state.isPicturesOpen })
  }

  render() {
    const statuses = []
    for (const status of this.state.statuses) {
      statuses.push(
        <option key={status.value} value={status.value}>
          {status.label}
        </option>
      )
    }

    return (
      <Card className={style.container}>
        {this.state.error && <div>{this.state.error.message}</div>}
        <h1>Bot Config - {this.state.name}</h1>
        <form>
          <FormGroup label="Name" labelFor="name">
            <InputGroup id="name" name="name" value={this.state.name} onChange={this.handleInputChanged} />
          </FormGroup>
          <FormGroup label="Status" labelFor="status">
            <select id="status" name="status" value={this.state.status} onChange={this.handleInputChanged}>
              {statuses}
            </select>
          </FormGroup>
          <FormGroup label="Description" labelFor="description">
            <InputGroup
              id="description"
              name="description"
              value={this.state.description}
              onChange={this.handleInputChanged}
            />
          </FormGroup>
          {this.renderLanguages()}
          <FormGroup>
            <Button onClick={this.handleDetailsCollapseClick}>
              {this.state.isDetailsOpen ? 'Hide' : 'Show'} details
            </Button>
            <Collapse isOpen={this.state.isDetailsOpen}>
              <Card elevation={Elevation.ONE}>
                <FormGroup label="Website" labelFor="website">
                  <InputGroup
                    id="website"
                    name="website"
                    value={this.state.website}
                    onChange={this.handleInputChanged}
                  />
                </FormGroup>
                <FormGroup label="Phone Number" labelFor="phone-number">
                  <InputGroup
                    id="phone-number"
                    name="phoneNumber"
                    value={this.state.phoneNumber}
                    onChange={this.handleInputChanged}
                  />
                </FormGroup>
                <FormGroup label="Contact E-mail" labelFor="email-address">
                  <InputGroup
                    id="email-address"
                    name="emailAddress"
                    value={this.state.emailAddress}
                    onChange={this.handleInputChanged}
                  />
                </FormGroup>
                <FormGroup label="Link to Terms &amp; Conditions" labelFor="terms-conditions">
                  <InputGroup
                    id="terms-conditions"
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
              </Card>
            </Collapse>
          </FormGroup>
          <FormGroup>
            <Button onClick={this.handlePicturesCollapseClick}>
              {this.state.isPicturesOpen ? 'Hide' : 'Show'} pictures
            </Button>
            <Collapse isOpen={this.state.isPicturesOpen}>
              <Card elevation={Elevation.ONE}>
                <FormGroup label="Bot Avatar" labelFor="avatar-url">
                  <FileInput
                    text="Choose file"
                    inputProps={{
                      id: 'avatar-url',
                      name: 'avatarUrl',
                      accept: 'image/*',
                      onChange: this.handleImageFileChanged
                    }}
                  />
                  {this.state.avatarUrl !== this.initialFormState.avatarUrl && (
                    <p className={style.configUploadSuccess}>
                      The bot avatar has been uploaded successfully. You need to save the form in order for the changes
                      to take effect.
                    </p>
                  )}
                  {this.state.avatarUrl && (
                    <img className={style.avatarPreview} alt="avatar" src={this.state.avatarUrl} />
                  )}
                </FormGroup>
                <FormGroup label="Cover Picture" labelFor="cover-picture-url">
                  <FileInput
                    text="Choose file"
                    inputProps={{
                      id: 'cover-picture-url',
                      name: 'coverPictureUrl',
                      accept: 'image/*',
                      onChange: this.handleImageFileChanged
                    }}
                  />
                  {this.state.coverPictureUrl !== this.initialFormState.coverPictureUrl && (
                    <p className={style.configUploadSuccess}>
                      The cover picture has been uploaded successfully. You need to save the form in order for the
                      changes to take effect.
                    </p>
                  )}
                  {this.state.coverPictureUrl && (
                    <img className={style.coverPreview} alt="cover" src={this.state.coverPictureUrl} />
                  )}
                </FormGroup>
              </Card>
            </Collapse>
          </FormGroup>
          <FormGroup>
            <Button
              text="Save changes"
              intent="primary"
              icon="floppy-disk"
              disabled={this.state.isSaving}
              onClick={this.saveChanges}
            />
          </FormGroup>
        </form>
      </Card>
    )
  }

  renderLanguages() {
    const languages = []
    for (const lang of this.state.languages) {
      languages.push(
        <option key={lang.value} value={lang.value}>
          {lang.label}
        </option>
      )
    }

    if (this.state.licensing && this.state.licensing.isPro) {
      return (
        <div>
          <FormGroup label="Default language" labelFor="selected-default-lang">
            <select
              id="selected-default-lang"
              name="selectedDefaultLang"
              value={this.state.selectedDefaultLang}
              onChange={this.handleDefaultLangChanged}
            >
              {languages}
            </select>
          </FormGroup>
          <FormGroup label="Supported languages" labelFor="selected-languages">
            <Select
              id="selected-languages"
              name="selectedLanguages"
              options={this.state.languages}
              value={this.state.selectedLanguages}
              onChange={this.handleLanguagesChanged}
              isMulti
            ></Select>
          </FormGroup>
        </div>
      )
    } else {
      return (
        <FormGroup label="Language" labelFor="selected-default-lang">
          <select
            id="selected-default-lang"
            name="selectedDefaultLang"
            value={this.state.selectedDefaultLang}
            onChange={this.handleCommunityLanguageChanged}
          >
            {languages}
          </select>
        </FormGroup>
      )
    }
  }
}

export default ConfigView
