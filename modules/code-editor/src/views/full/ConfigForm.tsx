import axios from 'axios'
import path from 'path'
import React, { FC, useEffect, useState } from 'react'
import Form from 'react-jsonschema-form'
import CodeEditorApi from './store/api'

interface Props {
  api: CodeEditorApi
  currentFile: any
  visible: boolean
}

const ConfigForm: FC<Props> = props => {
  const [data, setData] = useState({})
  const [schema, setSchema] = useState(undefined)

  useEffect(() => {
    console.log('cf', props.currentFile)
    loadSchema()
  }, [])

  const loadSchema = async () => {
    const module = path.basename(props.currentFile?.name)

    const schema = await props.api.getSchema({
      /// @ts-ignore
      module,
      name: module.replace('.json', ''),
      type: 'module_config',
      location: module
    })

    setSchema(schema)

    const code = await props.api.readFile({
      name: module,
      type: 'module_config',
      location: module
    })

    setData(JSON.parse(code))
  }

  if (!schema) {
    return null
  }

  const handleOnChange = event => {
    console.log('change', event)
  }

  return (
    <div style={{ padding: 20 }}>
      <Form formData={data} onChange={handleOnChange} schema={schema}>
        {props.children}
      </Form>
    </div>
  )
}

export default ConfigForm
