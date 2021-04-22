import { Tag } from '@blueprintjs/core'
import { NLU } from 'botpress/sdk'
import { lang } from 'botpress/shared'
import classnames from 'classnames'
import React from 'react'
import ReactDOM from 'react-dom'

import style from '../style.scss'

const MENU_WIDTH = 300

interface Props {
  show: boolean
  slots: NLU.SlotDefinition[]
  onSlotClicked: (s: NLU.SlotDefinition) => void
}

export const TagSlotPopover = (props: Props) => {
  if (!props.show || !window.getSelection().rangeCount) {
    return null
  }

  const nativeRange = window.getSelection().getRangeAt(0)
  const rect = nativeRange.getBoundingClientRect()

  // quick fix because slot menu has a variable that can't really be computed
  // ~ 3 slots / line, 1 line is 25 px
  // slot menu headr ~ 100px
  const top = rect.top - 100 - Math.ceil(props.slots.length / 3) * 25
  const left = rect.left - MENU_WIDTH / 2 + rect.width / 2 // center menu with selection

  return ReactDOM.createPortal(
    <div id="slot-menu" className={style['slotMenu']} style={{ top, left, width: MENU_WIDTH }}>
      {props.slots.length === 0 && (
        <React.Fragment>
          <p>{lang.tr('nlu.slots.noSlotsToTag')}</p>
        </React.Fragment>
      )}

      {props.slots.length > 0 && (
        <React.Fragment>
          <p>{lang.tr('nlu.slots.tagSelectionLabel')}</p>
          <p>{lang.tr('nlu.slots.tagSelectionMessage')}</p>
          <div>
            {props.slots.map((s, idx) => (
              <Tag
                key={s.name}
                className={classnames(style[`label-colors-${s.color}`], style.slotMenuItem, style.slotMark)}
                round
                onClick={() => props.onSlotClicked(s)}
              >
                <strong>{idx}&nbsp;|&nbsp;</strong>
                {s.name}
              </Tag>
            ))}
          </div>
        </React.Fragment>
      )}
    </div>,
    document.body
  )
}
