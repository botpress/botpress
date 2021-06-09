import { Icon } from '@blueprintjs/core'
import { lang, SupportedFileType } from 'botpress/shared'
import _ from 'lodash'
import React, { FC } from 'react'
import Form, { FieldProps, IChangeEvent, UiSchema, WidgetProps } from 'react-jsonschema-form'
import CheckboxWidget from 'react-jsonschema-form/lib/components/widgets/CheckboxWidget'
import SmartInput from '~/components/SmartInput'
import { getFormData } from '~/util/NodeFormData'
import style from '~/views/FlowBuilder/sidePanelTopics/form/style.scss'

import withLanguage from '../Util/withLanguage'

import ArrayFieldTemplate from './ArrayFieldTemplate'
import FlowPickWidget from './FlowPickWidget'
import ArrayMl from './i18n/Array'
import renderWrapped from './i18n/I18nWrapper'
import RefWidget from './RefWidget'
import localStyle from './style.scss'
import Text from './Text'
import { Fields, Schema, Widgets } from './typings'
import UploadWidget from './UploadWidget'

interface Props {
  contentLang: string
  onChange: any
  formData: FormData
  customKey: string
  schema: Schema
  uiSchema: UiSchema
  defaultLanguage: string
}

const CustomBaseInput = (props: WidgetProps) => {
  const SUPPORTED_MEDIA_SUBTYPES: SupportedFileType[] = ['audio', 'image', 'video', 'file']
  const { type, $subtype: subtype } = props.schema as Schema
  const { readonly } = props.options

  if (type === 'string') {
    if (subtype === 'ref') {
      return <RefWidget key={props?.formContext?.customKey} {...props} />
    } else if (subtype === 'flow') {
      return <FlowPickWidget key={props?.formContext?.customKey} {...props} />
    } else if (SUPPORTED_MEDIA_SUBTYPES.includes(subtype)) {
      return (
        <UploadWidget
          key={props?.formContext?.customKey}
          {...props}
          schema={{
            ...(props.schema as Schema),
            $subtype: subtype
          }}
        />
      )
    }
  }

  return (
    <SmartInput
      key={props?.formContext?.customKey}
      {...props}
      singleLine={true}
      readOnly={Boolean(readonly)}
      className={style.textarea}
    />
  )
}

const CustomCheckboxWidget = (props: WidgetProps) => {
  const { $help: help } = props.schema as Schema

  if (help) {
    const { text, link } = help
    return (
      <div>
        <CheckboxWidget {...props} />
        <span>{lang.tr(text)}</span>
        {link && (
          <a href={link} target="_blank">
            {link}
          </a>
        )}
      </div>
    )
  }

  return <CheckboxWidget {...props} />
}

const widgets: Widgets = {
  BaseInput: CustomBaseInput,
  CheckboxWidget: CustomCheckboxWidget
}

// TODO: Remove this once audio and video content-types are support on multiple channels
const CustomDescriptionField = ({ description, id, formContext }: FieldProps) => {
  if (id === 'root__description' && ['audio', 'video', 'location', 'file'].includes(formContext.subtype)) {
    const capitalize = (str: string) => {
      return str.charAt(0).toUpperCase() + str.slice(1)
    }

    return (
      <div id={id} style={{ lineHeight: 'normal' }}>
        <div>
          <span className={localStyle.warning}>
            <Icon icon="warning-sign" />
            &nbsp;{capitalize(formContext.subtype)} content-type is currently only supported by channel-vonage
          </span>
        </div>
        <br />
        <div>{description}</div>
      </div>
    )
  } else {
    return <div id={id}>{description}</div>
  }
}

const fields: Fields = {
  i18n_field: renderWrapped(Text),
  i18n_array: ArrayMl as any, // TODO: Fix typings with ArrayMl class component
  DescriptionField: CustomDescriptionField
}

const translatePropsRecursive = (schema: Schema) => {
  return _.reduce(
    schema,
    (result, value, key) => {
      if ((key === 'title' || key === 'description') && typeof value === 'string') {
        result[key] = lang.tr(value)
      } else if (_.isObject(value) && !_.isArray(value)) {
        result[key] = translatePropsRecursive(value as Schema)
      } else {
        result[key] = value
      }

      return result
    },
    {}
  )
}

const ContentForm: FC<Props> = props => {
  const handleOnChange = (event: IChangeEvent<FormData>) => {
    const newFields = Object.keys(event.formData).reduce((obj, key) => {
      obj[`${key}$${props.contentLang}`] = event.formData[key]
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

  const { formData, contentLang, defaultLanguage, schema } = props

  const currentFormData: FormData = getFormData(
    { formData },
    contentLang,
    defaultLanguage,
    schema.type === 'array' ? [] : {}
  )

  const context = {
    ...formData,
    customKey: props.customKey,
    activeLang: contentLang,
    defaultLang: defaultLanguage,
    subtype: schema.$subtype
  }

  return (
    <Form<FormData>
      {...props}
      formData={currentFormData}
      formContext={context}
      safeRenderCompletion
      widgets={widgets}
      fields={fields}
      ArrayFieldTemplate={ArrayFieldTemplate}
      onChange={handleOnChange}
      schema={translatePropsRecursive(schema)}
    >
      {props.children}
    </Form>
  )
}

export default withLanguage(ContentForm)
