import { HTMLTable } from '@blueprintjs/core'
import React from 'react'

import { FLAGGED_MESSAGE_STATUS } from '../../backend/db'

const DeletedList = ({ events }) => (
  <HTMLTable condensed interactive striped>
    <thead>
      <tr>
        <td>Phrase</td>
        <td>Date</td>
        <td>Move back to new</td>
      </tr>
    </thead>
    <tbody>
      {events.map((event, i) => (
        <tr key={i}>
          <td>{event.preview}</td>
          <td>{event.updatedAt}</td>
          <td>[link here]</td>
        </tr>
      ))}
    </tbody>
  </HTMLTable>
)

const MainScreen = ({ selectedEvent, selectedStatus, events, selectedEventIndex, totalEventsCount }) => {
  if (selectedStatus === FLAGGED_MESSAGE_STATUS.deleted) {
    return <DeletedList events={events} />
  }
  return null
}

export default MainScreen
