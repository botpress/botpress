import Form from '@rjsf/core'
import { toast } from 'botpress/shared'
import _ from 'lodash'
import path from 'path'
import React, { FC, useEffect, useState } from 'react'
import { FileWithMetadata } from './Editor'
import CodeEditorApi from './store/api'
import style from './style.scss'

interface Props {
  api: CodeEditorApi
  currentFile: FileWithMetadata
  visible: boolean
}

const ConfigForm: FC<Props> = props => {
  const [data, setData] = useState({})
  const [schema, setSchema] = useState(undefined)
  const [schemaUrl, setSchemaUrl] = useState('')

  useEffect(() => {
    // eslint-disable-next-line @typescript-eslint/no-floating-promises
    loadSchema()
  }, [props.currentFile])

  if (!props.currentFile) {
    return null
  }

  const loadSchema = async () => {
    const { type, name } = props.currentFile

    const filename = path.basename(name)
    const schema = await props.api.getSchema({ type, name: filename.replace('.json', '') })

    setSchema(_.omit(schema, 'properties.$schema'))

    let code
    if (type === 'main_config') {
      const name = 'botpress.config.json'
      code = await props.api.readFile({ type: 'main_config', name, location: name })
    } else if (type === 'bot_config') {
      const name = 'bot.config.json'
      code = await props.api.readFile({ type: 'bot_config', name, location: name, botId: window.BOT_ID })
    } else if (type === 'module_config') {
      code = await props.api.readFile({ type: 'module_config', name: filename, location: filename })
    }

    const data = JSON.parse(code)

    setData(_.omit(data, '$schema'))
    setSchemaUrl(data['$schema'])
  }

  if (!schema) {
    return null
  }

  const handleOnChange = event => {
    setData(event.formData)
  }

  const onSubmit = async () => {
    try {
      await props.api.saveFile({
        ..._.pick(props.currentFile, ['type', 'name', 'location', 'botId']),
        content: JSON.stringify({ ...data, $schema: schemaUrl }, undefined, 2)
      })

      toast.success('Configuration file saved successfully')
    } catch (err) {
      toast.failure(err)
    }
  }

  return (
    <div style={{ padding: 20 }} className={style.form}>
      <Form formData={data} onChange={handleOnChange} schema={schema} className={style.formSchema} onSubmit={onSubmit}>
        {props.children}
      </Form>
    </div>
  )
}

export default ConfigForm
