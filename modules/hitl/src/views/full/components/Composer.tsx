import React, { FC, useState } from 'react'
import ReactTextareaAutocomplete from '@webscopeio/react-textarea-autocomplete'
import '@webscopeio/react-textarea-autocomplete/style.css'
import { AutoComplete } from '../../../config'
import { HitlApi } from '../api'

interface Props {
  api: HitlApi
  currentSessionId: string
  autoCompleteConfig: AutoComplete
}

const Composer: FC<Props> = props => {
  const [message, setMessage] = useState('')

  const handleKeyPress = async event => {
    if (event.key === 'Enter' && message.trim().length > 0) {
      event.preventDefault()

      if (event.shiftKey) {
        return setMessage(message + '\n')
      }

      await props.api.sendMessage(props.currentSessionId, message.trim())
      setMessage('')
    }
  }
  console.log('autoCompleteConfig', props.autoCompleteConfig)
  const Item = ({ entity: { name, value } }) => <div>{`${name}: ${value}`}</div>
  const TriggerKey = props.autoCompleteConfig ? props.autoCompleteConfig.trigger : '/'
  const Shortcuts = props.autoCompleteConfig ? props.autoCompleteConfig.shortcuts : []

  return (
    <div className="bph-composer">
      <ReactTextareaAutocomplete
        className="my-textarea"
        value={message}
        onChange={event => setMessage(event.target.value)}
        onKeyPress={handleKeyPress}
        loadingComponent={() => <span>Loading</span>}
        trigger={{
          [TriggerKey]: {
            dataProvider: token => {
              return Shortcuts
            },
            component: Item,
            output: (item, trigger) => item.value
          }
        }}
      />
    </div>
  )
}

export default Composer
