import React, { FC, Fragment } from 'react'
import { connect, ConnectedProps } from 'react-redux'
import PageContainer from '../app/common/PageContainer'
import { AppState } from '../app/rootReducer'
import { Item } from './Item'
import style from './style.scss'

type Props = ConnectedProps<typeof connector>

const data = [
  {
    botId: 'brobro',
    clientId: '756a26ac-a96b-4e43-8c89-d764f398ef74',
    channels: {
      telegram: {
        botToken: 'sdsds'
      }
    }
  },
  {
    botId: 'gggg',
    clientId: 'd1c45555-be08-44bf-9338-c23d37d8e810',
    channels: {
      telegram: {
        botToken: 'dfdfdf'
      }
    }
  }
]

const Channels: FC<Props> = props => {
  return (
    <PageContainer title={'Channels'}>
      <div className={style.checklist}>
        {data.map(bot => (
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
