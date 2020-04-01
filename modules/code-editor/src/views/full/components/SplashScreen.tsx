import { Button } from '@blueprintjs/core'
import { lang } from 'botpress/shared'
import { KeyboardShortcut, SplashScreen } from 'botpress/ui'
import React from 'react'
import { MdCode } from 'react-icons/md'

import style from '../style.scss'

const description = lang.tr('editor.splash.editorDesc')

const rawEditorDesc = (
  <span>
    <span className={style.warning}>{lang.tr('editor.splash.bigWarning')}</span>
    <br />
    {lang.tr('editor.splash.rawEditorDesc')}
  </span>
)

export default ({ hasRawPermissions, isAdvanced, setAdvanced }) => (
  <SplashScreen
    icon={<MdCode />}
    title={lang.tr('editor.splash.codeEditor')}
    description={isAdvanced ? rawEditorDesc : description}
  >
    <KeyboardShortcut label={lang.tr('editor.splash.saveFile')} keys={['ACTION', 's']} />
    <KeyboardShortcut label={lang.tr('editor.splash.newFile')} keys={['ACTION', 'alt', 'n']} />
    <KeyboardShortcut label={lang.tr('editor.splash.commandPalette')} keys={['ACTION', 'shift', 'p']} />
    <br />
    {hasRawPermissions && (
      <div>
        <Button
          text={isAdvanced ? lang.tr('editor.splash.basicEditor') : lang.tr('editor.splash.advancedEditor')}
          onClick={() => setAdvanced(!isAdvanced)}
        />
      </div>
    )}
  </SplashScreen>
)
