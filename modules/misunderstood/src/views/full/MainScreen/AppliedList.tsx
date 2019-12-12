import React from 'react'

import { DbFlaggedEvent } from '../../../types'

import ResolvedEventsList from './ResolvedEventsList'

interface Props {
  events: DbFlaggedEvent[]
  totalEventsCount: number
}

const AppliedList = ({ events, totalEventsCount }: Props) => (
  <>
    <h3>Applied Misunderstood ({totalEventsCount})</h3>
    <ResolvedEventsList events={events} />
  </>
)

export default AppliedList
