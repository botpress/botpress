import { Button } from '@blueprintjs/core'
import { lang } from 'botpress/shared'
import { KeyboardShortcut, SplashScreen } from 'botpress/ui'
import React from 'react'
import { MdCode } from 'react-icons/md'

import style from '../style.scss'

export default ({ hasRawPermissions, isAdvanced, setAdvanced }) => (
  <SplashScreen
    icon={<MdCode />}
    title={lang.tr('module.code-editor.splash.codeEditor')}
    description={
      isAdvanced ? (
        <span>
          <span className={style.warning}>{lang.tr('module.code-editor.splash.bigWarning')}</span>
          <br />
          {lang.tr('module.code-editor.splash.rawEditorDesc')}
        </span>
      ) : (
        lang.tr('module.code-editor.splash.editorDesc')
      )
    }
  >
    <KeyboardShortcut label={lang.tr('module.code-editor.splash.saveFile')} keys={['ACTION', 's']} />
    <KeyboardShortcut label={lang.tr('module.code-editor.splash.newFile')} keys={['ACTION', 'alt', 'n']} />
    <KeyboardShortcut label={lang.tr('module.code-editor.splash.commandPalette')} keys={['ACTION', 'shift', 'p']} />
    <br />
    {hasRawPermissions && (
      <div>
        <Button
          text={
            isAdvanced
              ? lang.tr('module.code-editor.splash.basicEditor')
              : lang.tr('module.code-editor.splash.advancedEditor')
          }
          onClick={() => setAdvanced(!isAdvanced)}
        />
      </div>
    )}
  </SplashScreen>
)
