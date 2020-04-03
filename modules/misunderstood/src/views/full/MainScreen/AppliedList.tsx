import { lang } from 'botpress/shared'
import React from 'react'

import { DbFlaggedEvent } from '../../../types'

import ResolvedEventsList from './ResolvedEventsList'

interface Props {
  events: DbFlaggedEvent[]
  totalEventsCount: number
}

const AppliedList = ({ events, totalEventsCount }: Props) => (
  <>
    <h3>{lang.tr('module.misunderstood.appliedMisunderstood', { count: totalEventsCount })}</h3>
    <ResolvedEventsList events={events} />
  </>
)

export default AppliedList
