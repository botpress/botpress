import { Button, HTMLTable, Intent } from '@blueprintjs/core'
import { lang } from 'botpress/shared'
import React from 'react'

import { DbFlaggedEvent } from '../../../types'
import style from '../style.scss'
import { RESOLUTION } from '../util'

interface Props {
  events: DbFlaggedEvent[]
  resetEvent?: (id: number) => Promise<void>
}

const ResolvedEventsList = ({ events, resetEvent }: Props) =>
  events &&
  !!events.length && (
    <HTMLTable className={style.mainViewTable} condensed interactive striped>
      <thead>
        <tr>
          <th className={style.thPhrase}>{lang.tr('module.misunderstood.phrase')}</th>
          <th>{lang.tr('module.misunderstood.resolution')}</th>
          <th className={style.thUpdated}>{lang.tr('module.misunderstood.updated')}</th>
          <th className={style.thAction} />
        </tr>
      </thead>
      <tbody>
        {events.map((event, i) => (
          <tr key={i}>
            <td>{event.preview}</td>
            <td>
              {RESOLUTION[event.resolutionType]} <strong>{event.resolution}</strong>
              {event.resolutionParams && (
                <pre>
                  <code>{JSON.stringify(event.resolutionParams, null, 2)}</code>
                </pre>
              )}
            </td>
            <td>{event.updatedAt}</td>
            <td>
              {resetEvent && (
                <Button onClick={() => resetEvent(event.id)} small icon="refresh" intent={Intent.PRIMARY}>
                  {lang.tr('module.misunderstood.reset')}
                </Button>
              )}
            </td>
          </tr>
        ))}
      </tbody>
    </HTMLTable>
  )

export default ResolvedEventsList
