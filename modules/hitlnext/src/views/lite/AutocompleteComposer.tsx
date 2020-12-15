import React, { FC, useEffect, useState } from 'react'

import { Api } from './../full/Api'
import ReactTextareaAutocomplete from '@webscopeio/react-textarea-autocomplete'
import '@webscopeio/react-textarea-autocomplete/style.css'
import { Config } from '../../config'

const AutocompleteComposer: FC = () => {
  const [config, setConfig] = useState<Config>()

  const api = Api(bp) // TODO

  const Item = ({ entity: { name, value } }) => <div>{`${name}: ${value}`}</div>
  const Loading = ({ data }) => <div>Loading</div>

  async function getConfig() {
    try {
      return await api.getConfig()
    } catch (error) {
      throw error // Let Composer component handle the error
    }
  }

  useEffect(() => {
    getConfig()
  })

  return (
    <ReactTextareaAutocomplete
      className="my-textarea"
      loadingComponent={Loading}
      trigger={{
        [config.autoComplete.trigger]: {
          dataProvider: token => config.autoComplete.shortcuts,
          component: Item,
          output: (item, trigger) => item.value
        }
      }}
    />
  )
}

export default AutocompleteComposer
