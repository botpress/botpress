import axios from 'axios'
import cn from 'classnames'
import _ from 'lodash'
import React, { Fragment, useEffect, useState } from 'react'
import { Dropdown, Glyphicon, MenuItem } from 'react-bootstrap'

import ActionItem from './ActionItem'
import style from './StatusBar.styl'
import { lang } from 'botpress/shared'

interface BotInfo {
  id: string
  name: string
}

const BotSwitcher = () => {
  const [bots, setBots] = useState<BotInfo[]>([])
  const [isOpen, setOpen] = useState(false)

  useEffect(() => {
    // tslint:disable-next-line: no-floating-promises
    axios.get(`${window.BOT_API_PATH}/workspaceBotsIds`).then(({ data }) => setBots(data || []))
  }, [])

  const toggle = () => setOpen(!isOpen)
  const differentBots = bots.filter((bot: BotInfo) => window.BOT_ID !== bot.id)

  const getBotDisplayName = bot =>
    bots.filter(x => x.name === bot.name).length > 1 ? `${bot.name} (${bot.id})` : bot.name

  return (
    <Fragment>
      <ActionItem
        id="statusbar_switchbot"
        title={lang.tr('statusBar.switchBot')}
        description={lang.tr('statusBar.switchBotWarning')}
        onClick={toggle}
      >
        <Glyphicon glyph="retweet" style={{ marginRight: '5px' }} />
        <span>{window.BOT_NAME}</span>
      </ActionItem>

      <Dropdown dropup={true} open={isOpen} onToggle={toggle} id="bot-switcher">
        {/* react-bootstrap warning otherwise */}
        <Dropdown.Toggle style={{ display: 'none' }} />

        <Dropdown.Menu pullRight onClose={toggle} className={cn(style.langSwitherMenu, style.switchBotMenu)}>
          {differentBots.map(bot => (
            <li className={style.langItem} key={bot.id}>
              <a href={`studio/${bot.id}`}>{getBotDisplayName(bot)}</a>
            </li>
          ))}
          {differentBots.length > 0 && <MenuItem divider />}
          <li className={style.langItem}>
            <a key="admin" href="admin">
              {lang.tr('statusBar.backToAdmin')}
            </a>
          </li>
        </Dropdown.Menu>
      </Dropdown>
    </Fragment>
  )
}

export default BotSwitcher
