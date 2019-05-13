import React from 'react'

import { MdCode } from 'react-icons/md'

import { ACTION_KEY } from './utils/hotkey'
import style from './style.scss'

export default () => (
  <div className={style.splashScreen}>
    <div>
      <MdCode />
      <h1>Code Editor</h1>
      <p>
        Code editor allows you to create and edit actions without leaving botpress studio. It features typings and
        intelligent code completion.
      </p>
      <p>
        Save file&nbsp;
        <kbd>{ACTION_KEY}</kbd>
        &nbsp;+&nbsp;
        <kbd>s</kbd>
      </p>
      <p>
        New file&nbsp;
        <kbd>{ACTION_KEY}</kbd>
        &nbsp;+&nbsp;
        <kbd>alt</kbd>
        &nbsp;+&nbsp;
        <kbd>n</kbd>
      </p>
      <p>
        Command Palette&nbsp;
        <kbd>{ACTION_KEY}</kbd>
        &nbsp;+&nbsp;
        <kbd>shift</kbd>
        &nbsp;+&nbsp;
        <kbd>p</kbd>
      </p>
    </div>
  </div>
)
