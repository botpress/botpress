import cx from 'classnames'
import React, { FC, Fragment } from 'react'
import { connect, ConnectedProps } from 'react-redux'
import { generatePath } from 'react-router'
import { Link } from 'react-router-dom'
import PageContainer from '../app/common/PageContainer'
import { AppState } from '../app/rootReducer'
import style from './style.scss'

type Props = ConnectedProps<typeof connector>

const data = [
  {
    id: 'brobro',
    channels: {
      telegram: {
        botToken: 'sdsds'
      }
    }
  },
  {
    id: 'gggg',
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
      <div className={cx(style.table)}>
        {data.map(bot => (
          <Fragment key={bot.id}>
            <div className={cx('bp_table-row', style.tableRow)} key={bot.id}>
              <Link to={generatePath(`/channels/${bot.id}`)}>
                <span>{bot.id}</span>
              </Link>
            </div>
          </Fragment>
        ))}
      </div>
    </PageContainer>
  )
}

const mapStateToProps = (state: AppState) => ({})

const connector = connect(mapStateToProps)
export default connector(Channels)
