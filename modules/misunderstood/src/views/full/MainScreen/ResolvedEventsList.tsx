import { HTMLTable } from '@blueprintjs/core'
import React from 'react'

import { DbFlaggedEvent } from '../../../types'
import { RESOLUTION } from '../util'

const ResolvedEventsList = ({ events }: { events: DbFlaggedEvent[] }) =>
  events &&
  !!events.length && (
    <HTMLTable condensed interactive striped>
      <thead>
        <tr>
          <td>Phrase</td>
          <td>Resolution</td>
          <td>Updated</td>
        </tr>
      </thead>
      <tbody>
        {events.map((event, i) => (
          <tr key={i}>
            <td>{event.preview}</td>
            <td>
              {RESOLUTION[event.resolutionType]} {event.resolution}
              {event.resolutionParams && (
                <pre>
                  <code>{JSON.stringify(event.resolutionParams, null, 2)}</code>
                </pre>
              )}
            </td>
            <td>{event.updatedAt}</td>
          </tr>
        ))}
      </tbody>
    </HTMLTable>
  )

export default ResolvedEventsList
