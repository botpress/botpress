import axios from 'axios'
import { BotConfig, FormField } from 'botpress/sdk'
import { confirmDialog, Contents, lang, MainContent, sharedStyle, Tabs, toast } from 'botpress/shared'
import { BotEditSchema } from 'common/validation'
import Joi from 'joi'
import _ from 'lodash'
import React, { FC, useEffect, useRef, useState } from 'react'
import { connect } from 'react-redux'
import { fetchBotInformation } from '~/actions'

interface SelectItem {
  label: string
  value: string
}

interface Licensing {
  isPro: boolean
}

const axiosConfig = {
  baseURL: 'api/v1/'
}

interface OwnProps {
  close: () => void
}

type DispatchProps = typeof mapDispatchToProps
type StateProps = ReturnType<typeof mapStateToProps>

type Props = StateProps & DispatchProps & OwnProps

const ConfigForm: FC<Props> = ({ close, bot, fetchBotInformation }) => {
  const [error, setError] = useState(null)
  const [languageLoaded, setLanguageLoaded] = useState(false)
  const initialDisabledState = useRef(bot.disabled)
  const [licensing, setLicensing] = useState<Licensing>()
  const [languages, setLanguages] = useState<SelectItem[]>([])

  useEffect(() => {
    fetchBotInformation()
    // tslint:disable-next-line: no-floating-promises
    fetchLanguages()
    // tslint:disable-next-line: no-floating-promises
    fetchLicensing()
  }, [])

  const formData = {
    name: bot.name || '',
    disabled: bot.disabled,
    private: bot.private,
    description: bot.description || '',
    defaultLanguage: bot.defaultLanguage,
    languages: bot.languages,
    selectedLanguages: languages.filter(x => bot.languages && bot.languages.includes(x.value)),
    website: bot.details.website || '',
    phoneNumber: bot.details.phoneNumber || '',
    emailAddress: bot.details.emailAddress || '',
    termsConditions: bot.details.termsConditions || '',
    privacyPolicy: bot.details.privacyPolicy || '',
    avatarUrl: bot.details.avatarUrl || '',
    coverPictureUrl: bot.details.coverPictureUrl || ''
  }

  const fetchLanguages = async () => {
    const { data } = await axios.get('admin/languages/available', axiosConfig)
    const languages = _.sortBy(data.languages, 'name').map(language => ({
      label: lang.tr(`language.${language.name.toLowerCase()}`),
      value: language.code
    }))
    setLanguages(languages)
    setLanguageLoaded(true)
  }

  const fetchLicensing = async () => {
    const { data } = await axios.get('admin/license/status', axiosConfig)
    setLicensing(data.payload)
  }

  const fields: FormField[] = [
    {
      type: 'select',
      defaultValue: false,
      key: 'disabled',
      label: 'status',
      options: [
        {
          value: false,
          label: 'enabled'
        },
        {
          value: true,
          label: 'disabled'
        }
      ]
    },
    {
      type: 'select',
      defaultValue: true,
      key: 'private',
      label: 'visibility',
      options: [
        {
          value: true,
          label: 'status.private'
        },
        {
          value: false,
          label: 'status.public'
        }
      ]
    },
    {
      type: 'text',
      key: 'name',
      label: 'name',
      placeholder: 'config.whatIsYourChatbotName'
    },
    {
      type: 'textarea',
      key: 'description',
      label: 'description',
      placeholder: 'optional'
    },
    {
      type: 'upload',
      key: 'avatarUrl',
      label: 'config.botAvatar'
    },
    {
      type: 'upload',
      key: 'coverPictureUrl',
      label: 'config.coverPicture'
    }
  ]

  if (licensing?.isPro) {
    fields.push(
      {
        type: 'select',
        key: 'defaultLanguage',
        label: 'config.defaultLanguage',
        options: languages
      },
      {
        type: 'multi-select',
        key: 'selectedLanguages',
        label: 'languages',
        options: languages
      }
    )
  } else {
    fields.push({
      type: 'select',
      key: 'defaultLanguage',
      label: 'config.language',
      options: languages
    })
  }

  const advancedSettings: FormField[] = [
    { type: 'text', key: 'website', label: 'config.website', placeholder: 'optional' },
    { type: 'text', key: 'phoneNumber', label: 'config.phoneNumber', placeholder: 'optional' },
    { type: 'text', key: 'emailAddress', label: 'config.contactEmail', placeholder: 'optional' },
    { type: 'text', key: 'termsConditions', label: 'config.linkToTerms', placeholder: 'optional' },
    { type: 'text', key: 'privacyPolicy', label: 'config.linkToPolicy', placeholder: 'optional' }
  ]

  const handleSave = async data => {
    const botData: Partial<BotConfig> = {
      name: data.name || '',
      disabled: data.disabled,
      private: data.private,
      description: data.description || '',
      defaultLanguage: data.defaultLanguage,
      languages: data.selectedLanguages.map(x => x.value),
      details: {
        website: data.website || '',
        phoneNumber: data.phoneNumber || '',
        emailAddress: data.emailAddress || '',
        termsConditions: data.termsConditions || '',
        privacyPolicy: data.privacyPolicy || '',
        avatarUrl: data.avatarUrl || '',
        coverPictureUrl: data.coverPictureUrl || ''
      }
    }

    const validation = Joi.validate(botData, BotEditSchema)
    if (validation.error) {
      setError(validation.error.details.reduce((acc, error) => ({ ...acc, [error.context.key]: error.message }), {}))
      return
    }

    try {
      const disableChanged = botData.disabled !== initialDisabledState.current
      let allow = true

      if (disableChanged && botData.disabled) {
        allow = await confirmDialog(lang.tr('config.confirmUnmount'), {
          acceptLabel: 'Unmount'
        })
      }

      if (allow) {
        await axios.post(`admin/bots/${bot.id}`, botData, axiosConfig)
        setError(undefined)

        if (disableChanged) {
          window.location.reload()
        } else {
          fetchBotInformation()
        }
      } else {
        setError(undefined)
      }
    } catch (err) {
      setError(err.response?.data)
    }
  }

  return (
    <MainContent.RightSidebar className={sharedStyle.wrapper} canOutsideClickClose close={() => close()}>
      <div className={sharedStyle.formHeader}>
        <Tabs tabs={[{ id: 'content', title: lang.tr('toolbar.configuration') }]} />
      </div>

      {languageLoaded && (
        <Contents.Form
          axios={axios}
          fieldsError={error}
          mediaPath={`${window.BOT_API_PATH}/media`}
          fields={fields}
          advancedSettings={advancedSettings}
          formData={formData}
          onUpdate={data => handleSave(data)}
        />
      )}
    </MainContent.RightSidebar>
  )
}

const mapStateToProps = state => ({ bot: state.bot })

const mapDispatchToProps = {
  fetchBotInformation
}

export default connect(mapStateToProps, mapDispatchToProps)(ConfigForm)
