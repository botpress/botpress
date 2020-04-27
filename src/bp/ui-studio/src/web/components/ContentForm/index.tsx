import { lang } from 'botpress/shared'
import _ from 'lodash'
import React, { FC } from 'react'
import Form from 'react-jsonschema-form'
import SmartInput from '~/components/SmartInput'

import withLanguage from '../Util/withLanguage'

import ArrayMl from './i18n/Array'
import TextMl from './i18n/Text'
import FlowPickWidget from './FlowPickWidget'
import RefWidget from './RefWidget'
import UploadWidget from './UploadWidget'

interface Props {
  contentLang: string
  onChange: any
  formData: any
  schema: any
  defaultLanguage: string
}

const CustomBaseInput = props => {
  const { type, $subtype } = props.schema

  if (type === 'string') {
    if ($subtype === 'ref') {
      return <RefWidget {...props} />
    } else if ($subtype === 'media') {
      return <UploadWidget {...props} />
    } else if ($subtype === 'flow') {
      return <FlowPickWidget {...props} />
    }
  }

  return <SmartInput {...props} singleLine={true} />
}

const widgets = {
  BaseInput: CustomBaseInput
}

const fields = { i18n_field: TextMl, i18n_array: ArrayMl }

const translatePropsRecursive = obj => {
  return _.reduce(
    obj,
    (result, value, key) => {
      if ((key === 'title' || key === 'description') && typeof value === 'string') {
        result[key] = lang.tr(value)
      } else if (_.isObject(value) && !_.isArray(value)) {
        result[key] = translatePropsRecursive(value)
      } else {
        result[key] = value
      }

      return result
    },
    {}
  )
}

const ContentForm: FC<Props> = props => {
  const handleOnChange = event => {
    const newFields = Object.keys(event.formData).reduce((obj, key) => {
      obj[key + '$' + props.contentLang] = event.formData[key]
      return obj
    }, {})

    props.onChange({
      ...event,
      formData: {
        ...props.formData,
        ...newFields
      }
    })
  }

  const getFormDataForLang = (language: string) => {
    const languageKeys = Object.keys(props.formData).filter(x => x.includes('$' + language))

    return languageKeys.reduce((obj, key) => {
      obj[key.replace('$' + language, '')] = props.formData[key]
      return obj
    }, {})
  }

  const isFormEmpty = formData => {
    return _.every(
      Object.keys(formData).map(x => {
        // Ignore undefined and booleans, since they are set by default
        if (!formData[x] || _.isBoolean(formData[x])) {
          return
        }

        // Ignore array with empty objects (eg: skill choice)
        if (_.isArray(formData[x]) && !formData[x].filter(_.isEmpty).length) {
          return
        }

        return formData[x]
      }),
      _.isEmpty
    )
  }

  let formData = props.schema.type === 'array' ? [] : {}

  if (props.formData) {
    formData = getFormDataForLang(props.contentLang)

    if (isFormEmpty(formData)) {
      formData = getFormDataForLang(props.defaultLanguage)
    }
  }

  const context = {
    ...props.formData,
    activeLang: props.contentLang,
    defaultLang: props.defaultLanguage
  }

  return (
    <Form
      {...props}
      formData={formData}
      formContext={context}
      safeRenderCompletion
      widgets={widgets}
      fields={fields}
      onChange={handleOnChange}
      schema={translatePropsRecursive(props.schema)}
    >
      {props.children}
    </Form>
  )
}

export default withLanguage(ContentForm)
