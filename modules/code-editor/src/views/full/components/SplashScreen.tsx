import React from 'react'

import { KeyboardShortcut, SplashScreen } from 'botpress/ui'
import { MdCode } from 'react-icons/md'

export default () => (
  <SplashScreen
    icon={<MdCode />}
    title={'Code Editor'}
    description="Code editor allows you to create and edit actions without leaving botpress studio. It features typings and
    intelligent code completion."
  >
    <KeyboardShortcut label="Save file" keys={['ACTION', 's']} />
    <KeyboardShortcut label="New file" keys={['ACTION', 'alt', 'n']} />
    <KeyboardShortcut label="Command Palette" keys={['ACTION', 'shift', 'p']} />
  </SplashScreen>
)
