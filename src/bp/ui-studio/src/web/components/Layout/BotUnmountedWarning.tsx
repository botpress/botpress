import { Intent, Position, Toaster } from '@blueprintjs/core'
import React, { useEffect } from 'react'

export default () => {
  console.log(`window : ${window.IS_BOT_MOUNTED}`)
  if (!window.IS_BOT_MOUNTED) {
    const toastContent = (
      <div>
        <p>
          Language server is unreachable, bots wont work properly. Check &nbsp;
          <a href="https://botpress.io/docs/main/nlu#language-server" target="_blank">
            the docs
          </a>
        </p>
      </div>
    )

    Toaster.create({ position: Position.TOP }).show({
      message: toastContent,
      intent: Intent.DANGER,
      timeout: 0
    })
  }

  return null
}
