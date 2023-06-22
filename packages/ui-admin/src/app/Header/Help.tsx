import { Icon, Menu, MenuItem, Popover, Position, Button, Colors, Tooltip } from '@blueprintjs/core'
import { lang } from 'botpress/shared'
import React, { useState } from 'react'
import style from './style.scss'

const FORUM_LINK = 'https://discord.gg/botpress'
const DOCS_LINK = 'https://v12.botpress.com/'

export const HelpMenu = props => {
  return (
    <div id="help_dropdown">
      <Popover
        content={
          <Menu>
            <MenuItem icon="people" text={lang.tr('forum')} onClick={() => window.open(FORUM_LINK, '_blank')} />
            <MenuItem icon="book" text={lang.tr('docs')} onClick={() => window.open(DOCS_LINK, '_blank')} />
          </Menu>
        }
        minimal
        target={
          <Tooltip content={<div className={style.tooltip}>{lang.tr('help')}</div>}>
            <Button minimal>
              <Icon color={Colors.BLACK} icon="help" iconSize={16} />
            </Button>
          </Tooltip>
        }
        position={Position.TOP_RIGHT}
        canEscapeKeyClose
        fill
        modifiers={{
          preventOverflow: { enabled: true, boundariesElement: 'window' }
        }}
      />
    </div>
  )
}
