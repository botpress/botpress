import { Classes, H5, Intent, Position, Toaster } from '@blueprintjs/core'
import React, { useEffect } from 'react'

export default () => {
  if (window.IS_BOT_MOUNTED) {
    return
  }

  const toastContent = (
    <div>
      <div>
        <H5 className={Classes.DARK}>Bot is unmounted</H5>
        <p>
          Most functionalities of the bot are disabled. You can re-enable your bot by changing the status in the config
          menu.
        </p>
      </div>
    </div>
  )

  Toaster.create({ position: Position.TOP_RIGHT }).show({
    message: toastContent,
    intent: Intent.DANGER,
    timeout: 0
  })
}
