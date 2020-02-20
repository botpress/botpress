import {
  Button,
  Callout,
  Card,
  Collapse,
  Elevation,
  FileInput,
  FormGroup,
  InputGroup,
  Intent,
  TextArea
} from '@blueprintjs/core'
import axios from 'axios'
import { any } from 'bluebird'
import { BotConfig } from 'botpress/sdk'
import { BotEditSchema } from 'common/validation'
import Joi from 'joi'
import _ from 'lodash'
import React, { Component } from 'react'
import Select from 'react-select'
import confirmDialog from '~/components/Shared/ConfirmDialog'
import { toastFailure, toastSuccess } from '~/components/Shared/Utils/Toaster'

import style from './style.scss'

const statusList: SelectItem[] = [
  { label: 'Published', value: 'public' },
  { label: 'Collaborators Only', value: 'private' },
  { label: 'Unmounted', value: 'disabled' }
]

const axiosConfig = {
  baseURL: 'api/v1/'
}

interface StateBot {
  name: string
  status: SelectItem
  description: string
  selectedDefaultLang: SelectItem
  selectedLanguages: SelectItem[]
  website: string
  phoneNumber: string
  emailAddress: string
  termsConditions: string
  privacyPolicy: string
  avatarUrl: string
  coverPictureUrl: string
}

interface StateVars {
  botId: string
  licensing: Licensing
  languages: SelectItem[]
  statuses: SelectItem[]
  error: any
  isSaving: boolean
  isDetailsOpen: boolean
  isPicturesOpen: boolean
}

type State = StateBot & StateVars

interface Licensing {
  isPro: boolean
}

interface SelectItem {
  label: string
  value: string
}

class ConfigView extends Component<any, State> {
  initialFormState: StateBot = {
    name: '',
    status: { value: '', label: '' },
    description: '',
    selectedDefaultLang: { value: '', label: '' },
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
    licensing: undefined,
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
      status: this.state.statuses.find(s => s.value === status),
      description: bot.description || '',
      selectedDefaultLang: languages.find(l => l.value === bot.defaultLanguage),
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

  async fetchBots(): Promise<BotConfig[]> {
    const res = await axios.get('admin/bots', axiosConfig)
    return res.data.payload.bots
  }

  async fetchLanguages(): Promise<SelectItem[]> {
    const { data } = await axios.get('admin/languages/available', axiosConfig)
    const languages = _.sortBy(data.languages, 'name').map(lang => ({
      label: lang.name,
      value: lang.code
    }))
    return languages
  }

  async fetchLicensing(): Promise<Licensing> {
    const { data } = await axios.get('admin/license/status', axiosConfig)
    return data.payload
  }

  saveChanges = async () => {
    this.setState({ error: undefined, isSaving: true })

    const bot: BotConfig = {
      name: this.state.name,
      disabled: this.state.status.value === 'disabled',
      private: this.state.status.value === 'private',
      description: this.state.description,
      defaultLanguage: this.state.selectedDefaultLang.value,
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
      const disableChanged = bot.disabled != (this.initialFormState.status.value === 'disabled')
      let allow = true

      if (disableChanged && bot.disabled) {
        allow = await confirmDialog(
          `Are you sure want to unmount this bot? All of the functionalities of this bot will become unavailable.`,
          { acceptLabel: 'Unmount' }
        )
      }

      if (allow) {
        await axios.post(`admin/bots/${this.state.botId}`, bot, axiosConfig)
        toastSuccess('Bot configuration updated successfully')
        this.setState({ error: undefined, isSaving: false })

        if (disableChanged) {
          window.location.reload()
        }
      } else {
        this.setState({ error: undefined, isSaving: false })
      }
    } catch (err) {
      this.setState({ error: err, isSaving: false })
    }
  }

  handleInputChanged = event => {
    this.setState({ [event.target.name]: event.target.value })
  }

  handleStatusChanged = status => {
    this.setState({ status })
  }

  handleDefaultLangChanged = async lang => {
    if (!this.state.selectedDefaultLang) {
      this.setState({ selectedDefaultLang: lang })
      return
    }

    if (this.state.selectedDefaultLang !== lang) {
      const currentName = this.state.languages.find(x => x.value === this.state.selectedDefaultLang.value).label
      const newName = this.state.languages.find(x => x.value === lang.value).label
      const conf = await confirmDialog(
        `Are you sure you want to change the language of your bot from ${currentName} to ${newName}? All of your content elements will be copied, make sure you translate them.`,
        { acceptLabel: 'Change' }
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
      const res = await axios.post(`bots/${this.state.botId}/media`, data, {
        ...axiosConfig,
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
    return (
      <Card className={style.container}>
        {this.state.error && (
          <Callout intent={Intent.DANGER} title="Error">
            {this.state.error.message}
          </Callout>
        )}
        <h1>Bot Config - {this.state.name}</h1>
        <form>
          <FormGroup label="Name" labelFor="name">
            <InputGroup id="name" name="name" value={this.state.name} onChange={this.handleInputChanged} />
          </FormGroup>
          <FormGroup label="Status" labelFor="status">
            <Select
              id="status"
              name="status"
              options={this.state.statuses}
              value={this.state.status}
              onChange={this.handleStatusChanged}
            />
          </FormGroup>
          <FormGroup label="Description" labelFor="description">
            <TextArea
              id="description"
              name="description"
              rows={3}
              className={style.textarea}
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
    const languages = this.state.languages.map(l => (
      <option key={l.value} value={l.value}>
        {l.label}
      </option>
    ))

    if (this.state.licensing && this.state.licensing.isPro) {
      return (
        <div>
          <FormGroup label="Default language" labelFor="selected-default-lang">
            <Select
              id="selected-default-lang"
              name="selectedDefaultLang"
              options={this.state.languages}
              value={this.state.selectedDefaultLang}
              onChange={this.handleDefaultLangChanged}
            />
          </FormGroup>
          <FormGroup label="Supported languages" labelFor="selected-languages">
            <Select
              id="selected-languages"
              name="selectedLanguages"
              options={this.state.languages}
              value={this.state.selectedLanguages}
              onChange={this.handleLanguagesChanged}
              isMulti
            />
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
