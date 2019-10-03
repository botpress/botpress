import { Button, Intent } from '@blueprintjs/core'
import React from 'react'

import { DbFlaggedEvent } from '../../../types'

import ResolvedEventsList from './ResolvedEventsList'

interface Props {
  events: DbFlaggedEvent[]
  totalEventsCount: number
  applyAllPending: () => Promise<void>
}

const PendingList = ({ events, totalEventsCount, applyAllPending }: Props) => (
  <>
    <h3>Pending Misunderstood ({totalEventsCount})</h3>
    <div>
      {events && events.length > 0 && (
        <Button onClick={applyAllPending} intent={Intent.WARNING} icon="export" fill>
          Apply all pending
        </Button>
      )}
    </div>
    <ResolvedEventsList events={events} />
  </>
)

export default PendingList
