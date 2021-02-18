import { Button, Intent } from '@blueprintjs/core'
import { lang } from 'botpress/shared'
import React from 'react'

import { DbFlaggedEvent } from '../../../types'
import StickyActionBar from '../StickyActionBar'

import ResolvedEventsList from './ResolvedEventsList'
import style from './style.scss'

interface Props {
  events: DbFlaggedEvent[]
  totalEventsCount: number
  applyAllPending: () => Promise<void>
  resetPendingEvent: (id: number) => Promise<void>
}

const PendingList = ({ events, totalEventsCount, applyAllPending, resetPendingEvent }: Props) => (
  <>
    <h3>{lang.tr('module.misunderstood.pendingMisunderstood', { count: totalEventsCount })}</h3>

    {events && events.length > 0 && (
      <StickyActionBar>
        <div className={style.applyAllButton}>
          <Button onClick={applyAllPending} intent={Intent.WARNING} icon="export" fill>
            {lang.tr('module.misunderstood.applyAllPending')}
          </Button>
        </div>
      </StickyActionBar>
    )}

    <ResolvedEventsList events={events} resetEvent={resetPendingEvent} />
  </>
)

export default PendingList
