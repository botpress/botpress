import React from 'react'

import { MdCode } from 'react-icons/md'

import { SplashScreen, KeyboardShortcut } from 'botpress/ui'

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
