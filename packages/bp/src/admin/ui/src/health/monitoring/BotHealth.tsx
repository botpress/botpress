import { Button, Tooltip } from '@blueprintjs/core'
import { confirmDialog, toast } from 'botpress/shared'
import cx from 'classnames'
import _ from 'lodash'
import React, { FC, useEffect, useState } from 'react'
import { connect, ConnectedProps } from 'react-redux'
import { generatePath, RouteComponentProps, withRouter } from 'react-router'
import ReactTable from 'react-table'

import api from '~/app/api'
import Dropdown, { Option } from '~/app/common/Dropdown'
import { AppState } from '~/app/rootReducer'
import { getActiveWorkspace } from '~/auth/basicAuth'
import { switchWorkspace } from '~/user/reducer'
import { fetchBotHealth, fetchBotsByWorkspace } from '~/workspace/bots/reducer'
import { filterText } from '~/workspace/logs/utils'
import style from './style.scss'

type Props = ConnectedProps<typeof connector> & RouteComponentProps

const getKey = entry => `${entry.hostname} (${entry.serverId})`

const STATUS: Option[] = [
  { label: 'All', value: '' },
  { label: 'Healthy', value: 'healthy' },
  { label: 'Unhealthy', value: 'unhealthy' },
  { label: 'Disabled', value: 'disabled' }
]

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

  const filterStatus = ({ onChange }) => {
    return <Dropdown items={STATUS} defaultItem={STATUS[0]} onChange={option => onChange(option.value)} small />
  }

  const goToBotLogs = async (botId: string) => {
    if (props.botsByWorkspace) {
      const workspace = _.findKey(props.botsByWorkspace, x => x.includes(botId))
      workspace && props.switchWorkspace(workspace)
    }

    props.history.push(
      generatePath('/workspace/:workspaceId?/logs?botId=:botId', {
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
              switch (_.get(cell.original, `data[${key}].status`)) {
                default:
                  return 'N/A'
                case 'unhealthy':
                  return <span className={style.logCritical}>Unhealthy</span>
                case 'healthy':
                  return <span className={style.logInfo}>Healthy</span>
                case 'disabled':
                  return 'Disabled'
              }
            },
            Filter: filterStatus,
            filterable: true,
            width: 100,
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
                <a onClick={() => goToBotLogs(x.original.botId)} className={style.link}>
                  {x.original.botId}
                </a>
              </Tooltip>
            </span>
          )
        },
        width: 250,
        Filter: filterText,
        filterable: true
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
      await api.getSecured().post(`/admin/workspace/bots/${botId}/reload`)
      toast.success('Bot remounted successfully')
    } catch (err) {
      console.error(err)
      toast.failure('Could not mount bot. Check server logs for details')
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
      defaultSorted={[{ id: 'botId', desc: false }]}
      className={cx('-striped -highlight', style.monitoringOverview)}
    />
  )
}

const mapStateToProps = (state: AppState) => ({
  health: state.bots.health,
  botsByWorkspace: state.bots.botsByWorkspace
})

const connector = connect(mapStateToProps, { fetchBotHealth, switchWorkspace, fetchBotsByWorkspace })

export default withRouter(connector(BotHealth))
