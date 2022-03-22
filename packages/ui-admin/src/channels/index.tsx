import { toast } from 'botpress/shared'
import React, { FC, useEffect, useState } from 'react'
import api from '~/app/api'
import PageContainer from '../app/common/PageContainer'
import { ClientConfig } from './ClientConfig'
import style from './style.scss'

const Channels: FC = () => {
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
        {clients.map(client => (
          <ClientConfig key={client.botId} botId={client.botId} clientId={client.clientId} />
        ))}
      </div>
    </PageContainer>
  )
}

export default Channels
