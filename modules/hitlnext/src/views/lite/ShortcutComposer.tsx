import { Button } from '@blueprintjs/core'
import ReactTextareaAutocomplete from '@webscopeio/react-textarea-autocomplete'
// import '@webscopeio/react-textarea-autocomplete/style.css'
import cx from 'classnames'
import React, { FC, useEffect, useRef, useState } from 'react'

import { Config, IShortcut } from '../../config'
import { makeClient } from '../client'
import lang from '../lang'

import style from './style.scss'

// store here is the whole webchat store
// reference here: modules/channel-web/src/views/lite/store/index.ts
interface ComposerProps {
  name: string
  store: {
    bp: any
    composer: any
    sendMessage: () => Promise<void>
  }
}

interface ShortcutItemProps {
  selected: boolean
  trigger: string
  entity: IShortcut
}
const ShortcutItem: FC<ShortcutItemProps> = props => (
  <div className={cx(style.shortcutItem, { [style.selected]: props.selected })}>
    <span className={style.shortcutKey}>{`${props.trigger}${props.entity.name}`}</span>
    <span className={style.shortcutValue}>{`${props.entity.value}`}</span>
  </div>
)

const ShortcutComposer: FC<ComposerProps> = props => {
  const bp = props.store.bp
  const [config, setConfig] = useState<Config>()
  const [isLoading, setIsLoading] = useState(true)
  const [text, setText] = useState<string>('')
  const rtaRef = useRef()

  const hitlClient = makeClient(bp)

  useEffect(() => {
    hitlClient
      .getConfig()
      .then(config => setConfig(config))
      .finally(() => setIsLoading(false))
  })

  const sendMessage = async (): Promise<void> => {
    if (!canSendText()) {
      return
    }

    props.store.composer.updateMessage(text.trim())
    await props.store.sendMessage()
    setText('')
  }

  const handleChange: React.ChangeEventHandler<HTMLTextAreaElement> = event => {
    setText(event.target.value)
  }

  const handleKeyDown: React.EventHandler<React.KeyboardEvent> = event => {
    if (event.shiftKey) {
      return
    }
    if (event.key === 'Enter') {
      event.preventDefault() // prevent \n
      sendMessage().catch(() => console.error('could not send message'))
    }
  }

  const canSendText = (): boolean => text.trim().length > 0

  return (
    !isLoading && (
      <div id="shortcutContainer" className={style.composerContainer}>
        <ReactTextareaAutocomplete
          containerClassName={cx('bpw-composer', style.composer)}
          className={'bpw-composer-inner'}
          dropdownClassName={style.shortcutDropdown}
          itemClassName={style.shortcutListItem}
          loadingComponent={() => null}
          minChar={0}
          placeholder={lang.tr('module.hitlnext.conversation.composerPlaceholder')}
          value={text}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          scrollToItem={false}
          boundariesElement="#shortcutContainer"
          ref={rtaRef}
          trigger={{
            [config.autoComplete.trigger]: {
              dataProvider: (token: string) =>
                config.autoComplete.shortcuts.filter(s => s.name.toLowerCase().includes(token)),
              component: props => <ShortcutItem {...props} trigger={config.autoComplete.trigger} />,
              output: (s: IShortcut) => s.value
            }
          }}
        />
        <Button className={style.sendButton} disabled={!canSendText()} onClick={sendMessage}>
          {lang.tr('module.hitlnext.conversation.send')}
        </Button>
      </div>
    )
  )
}

export default ShortcutComposer
