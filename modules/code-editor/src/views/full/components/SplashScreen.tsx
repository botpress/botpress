import { Button } from '@blueprintjs/core'
import { lang } from 'botpress/shared'
import { KeyboardShortcut, SplashScreen } from 'botpress/ui'
import React from 'react'
import { MdCode } from 'react-icons/md'

import style from '../style.scss'

const description = lang.tr('edito.splash.editorDesc')

const rawEditorDesc = (
  <span>
    <span className={style.warning}>{lang.tr('edito.splash.bigWarning')}</span>
    <br />
    {lang.tr('edito.splash.rawEditorDesc')}
  </span>
)

export default ({ hasRawPermissions, isAdvanced, setAdvanced }) => (
  <SplashScreen
    icon={<MdCode />}
    title={lang.tr('edito.splash.codeEditor')}
    description={isAdvanced ? rawEditorDesc : description}
  >
    <KeyboardShortcut label={lang.tr('edito.splash.saveFile')} keys={['ACTION', 's']} />
    <KeyboardShortcut label={lang.tr('edito.splash.newFile')} keys={['ACTION', 'alt', 'n']} />
    <KeyboardShortcut label={lang.tr('edito.splash.commandPalette')} keys={['ACTION', 'shift', 'p']} />
    <br />
    {hasRawPermissions && (
      <div>
        <Button
          text={isAdvanced ? lang.tr('edito.splash.basicEditor') : lang.tr('edito.splash.advancedEditor')}
          onClick={() => setAdvanced(!isAdvanced)}
        />
      </div>
    )}
  </SplashScreen>
)
