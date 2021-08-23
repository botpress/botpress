import React, { useEffect, useState } from 'react'
import Select from 'react-select'
import Creatable from 'react-select/lib/Creatable'
import { Renderer } from '../../../typings'
import { renderUnsafeHTML } from '../../../utils'
import * as Keyboard from '../../Keyboard'

export const Dropdown = (props: Renderer.Dropdown) => {
  const [options, setOptions] = useState<Renderer.Option[]>([])
  const [selectedOption, setSelectedOption] = useState<any>()

  useEffect(() => {
    if (props.options) {
      setOptions(props.options.map(x => ({ value: x.value || x.label, label: x.label })))
    }
  }, [])

  useEffect(() => {
    if (!props.buttonText) {
      sendChoice()
    }
  }, [selectedOption])

  const sendChoice = () => {
    if (!selectedOption) {
      return
    }

    let { label, value } = selectedOption

    if (selectedOption.length) {
      label = selectedOption.map(x => x.label).join(',')
      value = selectedOption.map(x => x.value || x.label).join(',')
    }

    props.onSendData && props.onSendData({ type: 'quick_reply', text: label, payload: value || label })
  }

  const renderSelect = inKeyboard => {
    return (
      <div className={inKeyboard && 'bpw-keyboard-quick_reply-dropdown'}>
        <div style={{ width: props.width || '100%', display: 'inline-block' }}>
          {props.allowCreation ? (
            <Creatable
              value={selectedOption}
              onChange={setSelectedOption}
              options={options}
              placeholder={props.placeholderText}
              isMulti={props.allowMultiple}
              menuPlacement={'top'}
            />
          ) : (
            <Select
              value={selectedOption}
              onChange={setSelectedOption}
              options={options}
              placeholder={props.placeholderText}
              isMulti={props.allowMultiple}
              menuPlacement={'top'}
            />
          )}
        </div>

        {props.buttonText && (
          <button className="bpw-button" onClick={sendChoice}>
            {props.buttonText}
          </button>
        )}
      </div>
    )
  }

  const shouldDisplay = props.isLastGroup && props.isLastOfGroup
  let message

  if (props.markdown) {
    const html = renderUnsafeHTML(props.message, props.escapeHTML)
    message = <div dangerouslySetInnerHTML={{ __html: html }} />
  } else {
    message = <p>{props.message}</p>
  }

  if (props.displayInKeyboard && Keyboard.Default.isReady()) {
    return (
      <Keyboard.Prepend keyboard={renderSelect(true)} visible={shouldDisplay}>
        {message}
      </Keyboard.Prepend>
    )
  }

  return (
    <div>
      {message}
      {shouldDisplay && renderSelect(false)}
    </div>
  )
}
