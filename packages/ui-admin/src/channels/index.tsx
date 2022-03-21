import { toast } from 'botpress/shared'
import React, { FC, Fragment, useEffect, useState } from 'react'
import { connect, ConnectedProps } from 'react-redux'
import api from '~/app/api'
import PageContainer from '../app/common/PageContainer'
import { AppState } from '../app/rootReducer'
import { Item } from './Item'
import style from './style.scss'

type Props = ConnectedProps<typeof connector>

const Channels: FC<Props> = props => {
  const [clients, setClients] = useState<{ clientId: string; botId: string }[]>([])

  useEffect(() => {
    const fetch = async () => {
      try {
        const { data } = await api.getSecured().get('/admin/management/channels/clients')
        setClients(data)
      } catch (err) {
        toast.failure(err.message)
      }
    }

    void fetch()
  }, [])

  return (
    <PageContainer title={'Channels'}>
      <div className={style.checklist}>
        {clients.map(bot => (
          <Fragment key={bot.botId}>
            <Item botId={bot.botId} clientId={bot.clientId}></Item>
          </Fragment>
        ))}
      </div>
    </PageContainer>
  )
}

const mapStateToProps = (state: AppState) => ({})

const connector = connect(mapStateToProps)
export default connector(Channels)
