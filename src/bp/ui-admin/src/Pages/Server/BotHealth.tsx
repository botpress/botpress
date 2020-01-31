import { Button, Tooltip } from '@blueprintjs/core'
import { ServerHealth } from 'common/typings'
import _ from 'lodash'
import React, { FC, useEffect, useState } from 'react'
import { connect } from 'react-redux'
import ReactTable from 'react-table'
import api from '~/api'
import { fetchBotHealth } from '~/reducers/bots'
import { toastFailure, toastSuccess } from '~/utils/toaster'
import confirmDialog from '~/App/ConfirmDialog'

interface Props {
  health?: ServerHealth[]
  fetchBotHealth: () => void
}

const getKey = entry => `${entry.hostname} (${entry.serverId})`

const BotHealth: FC<Props> = props => {
  const [data, setData] = useState<any>()
  const [columns, setColumns] = useState<any>([])

  useEffect(() => {
    if (!props.health) {
      props.fetchBotHealth()
    } else {
      updateColumns()
      refreshContent()
    }
  }, [props.health])

  const refreshContent = () => {
    const botIds = _.uniq(_.flatMap(props.health, x => Object.keys(x.bots)))

    const data = botIds.map(botId => ({
      botId,
      data: props.health!.reduce((obj, entry) => {
        obj[getKey(entry)] = entry.bots[botId]
        return obj
      }, {})
    }))

    setData(data)
  }

  const updateColumns = () => {
    const hostColumns = props.health!.map(entry => {
      const key = getKey(entry)
      return {
        Header: entry.hostname,
        columns: [
          {
            Header: 'Status',
            Cell: cell => {
              switch (_.get(cell.original, `data[${key}].status`)) {
                default:
                  return 'N/A'
                case 'error':
                  return <span style={{ color: 'red' }}>Error</span>
                case 'mounted':
                  return 'Mounted'
                case 'disabled':
                  return 'Disabled'
                case 'unmounted':
                  return 'Unmounted'
              }
            },
            width: 80,
            accessor: `data[${key}].status`
          },
          {
            Header: 'Errors',
            width: 60,
            className: 'center',
            accessor: `data[${key}].errorCount`
          },
          {
            Header: 'Warnings',
            width: 60,
            className: 'center',
            accessor: `data[${key}].warningCount`
          }
        ]
      }
    })

    setColumns([
      {
        Header: 'Bot ID',
        accessor: 'botId',
        width: 250
      },
      ...hostColumns,
      {
        Cell: x => (
          <Tooltip content="Reload bot">
            <Button icon="refresh" onClick={() => reloadBot(x.original.botId)} small />
          </Tooltip>
        ),
        filterable: false,
        width: 45
      }
    ])
  }

  const reloadBot = async (botId: string) => {
    if (!(await confirmDialog(`Are you sure you want to reload the bot ${botId}?`, { acceptLabel: 'Reload bot' }))) {
      return
    }

    try {
      await api.getSecured().post(`/admin/bots/${botId}/reload`)
      toastSuccess(`Bot remounted successfully`)
    } catch (err) {
      console.log(err)
      toastFailure(`Could not mount bot. Check server logs for details`)
    }
  }

  if (!props.health) {
    return null
  }

  return (
    <ReactTable
      columns={columns}
      data={data}
      defaultPageSize={10}
      defaultSorted={[{ id: 'host', desc: false }]}
      className="-striped -highlight monitoringOverview"
    />
  )
}

const mapStateToProps = state => ({
  health: state.bots.health
})

export default connect(mapStateToProps, { fetchBotHealth })(BotHealth)
