import { Button, Tooltip } from '@blueprintjs/core'
import { ServerHealth } from 'common/typings'
import _ from 'lodash'
import React, { FC, useEffect, useState } from 'react'
import { connect } from 'react-redux'
import { generatePath, RouteComponentProps, withRouter } from 'react-router'
import ReactTable from 'react-table'
import api from '~/api'
import { fetchBotHealth, fetchBotsByWorkspace } from '~/reducers/bots'
import { switchWorkspace } from '~/reducers/user'
import { toastFailure, toastSuccess } from '~/utils/toaster'
import confirmDialog from '~/App/ConfirmDialog'
import { getActiveWorkspace } from '~/Auth'

type Props = {
  health?: ServerHealth[]
  botsByWorkspace?: { [workspaceId: string]: string[] }
  fetchBotHealth: () => void
  fetchBotsByWorkspace: () => void
  switchWorkspace: (workspaceName: string) => void
} & RouteComponentProps

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

    if (!props.botsByWorkspace) {
      props.fetchBotsByWorkspace()
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

  const goToBotLogs = async (botId: string) => {
    if (props.botsByWorkspace) {
      const workspace = _.findKey(props.botsByWorkspace, x => x.includes(botId))
      workspace && props.switchWorkspace(workspace)
    }

    props.history.push(
      generatePath(`/workspace/:workspaceId?/logs?botId=:botId`, {
        workspaceId: getActiveWorkspace() || undefined,
        botId
      })
    )
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
              const hasCriticalIssue = !!Object.values(cell.original.data).find((x: any) => x.criticalCount > 0)
              if (hasCriticalIssue) {
                return <span className="logCritical">Unhealthy</span>
              }

              switch (_.get(cell.original, `data[${key}].status`)) {
                default:
                  return 'N/A'
                case 'error':
                  return <span className="logError">Error</span>
                case 'mounted':
                  return <span className="logInfo">Healthy</span>
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
            Header: 'Critical',
            width: 60,
            className: 'center',
            accessor: `data[${key}].criticalCount`
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
        Cell: x => {
          return (
            <span>
              <Tooltip hoverOpenDelay={1000} content="View logs for this bot">
                <a onClick={() => goToBotLogs(x.original.botId)} className="link">
                  {x.original.botId}
                </a>
              </Tooltip>
            </span>
          )
        },
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
    <ReactTable columns={columns} data={data} defaultPageSize={10} className="-striped -highlight monitoringOverview" />
  )
}

const mapStateToProps = state => ({
  health: state.bots.health,
  botsByWorkspace: state.bots.botsByWorkspace
})

export default withRouter(
  connect(mapStateToProps, { fetchBotHealth, switchWorkspace, fetchBotsByWorkspace })(BotHealth)
)
