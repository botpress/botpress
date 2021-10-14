import React, { useEffect, useState } from 'react'
import Select from 'react-select'
import Creatable from 'react-select/creatable'
import { DropdownOption, MessageTypeHandlerProps } from 'typings'
import Keyboard, { Prepend } from '../Keyboard'
import { renderUnsafeHTML } from '../utils'

export const Dropdown = ({ payload, config }: MessageTypeHandlerProps<'dropdown'>) => {
  const [options, setOptions] = useState<DropdownOption[]>([])
  const [selectedOption, setSelectedOption] = useState<any>()

  useEffect(() => {
    if (payload.options.length) {
      setOptions(payload.options.map(x => ({ value: x.value || x.label, label: x.label })))
    }
  }, [])

  useEffect(() => {
    if (!payload.buttonText) {
      sendChoice().catch(console.error)
    }
  }, [selectedOption])

  const sendChoice = async () => {
    if (!selectedOption) {
      return
    }

    let { label, value } = selectedOption

    if (selectedOption.length) {
      label = selectedOption.map((x: any) => x.label).join(',')
      value = selectedOption.map((x: any) => x.value || x.label).join(',')
    }

    await config.onSendData({ type: 'quick_reply', text: label, payload: value || label })
  }

  const renderSelect = (inKeyboard: boolean) => {
    return (
      <div className={inKeyboard ? 'bpw-keyboard-quick_reply-dropdown' : ''}>
        <div style={{ width: payload.width || '100%', display: 'inline-block' }}>
          {payload.allowCreation ? (
            <Creatable
              value={selectedOption}
              onChange={setSelectedOption}
              options={options}
              placeholder={payload.placeholderText}
              isMulti={payload.allowMultiple}
              menuPlacement={'top'}
            />
          ) : (
            <Select
              value={selectedOption}
              onChange={setSelectedOption}
              options={options}
              placeholder={payload.placeholderText}
              isMulti={payload.allowMultiple}
              menuPlacement={'top'}
            />
          )}
        </div>

        {payload.buttonText && (
          <button className="bpw-button" onClick={sendChoice}>
            {payload.buttonText}
          </button>
        )}
      </div>
    )
  }

  const shouldDisplay = config.isLastGroup && config.isLastOfGroup
  let message: React.ReactElement

  if (payload.markdown) {
    const html = renderUnsafeHTML(payload.message, payload.escapeHTML)
    message = <div dangerouslySetInnerHTML={{ __html: html }} />
  } else {
    message = <p>{payload.message}</p>
  }

  if (payload.displayInKeyboard && Keyboard.isReady()) {
    return (
      <Prepend keyboard={renderSelect(true)} visible={shouldDisplay}>
        {message}
      </Prepend>
    )
  }

  return (
    <div>
      {message}
      {shouldDisplay && renderSelect(false)}
    </div>
  )
}
