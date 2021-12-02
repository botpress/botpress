import { Dropdown, Option, lang } from 'botpress/shared'
import _ from 'lodash'
import React, { FC, useEffect, useState } from 'react'
import { connect, ConnectedProps } from 'react-redux'

import { AppState } from '~/app/rootReducer'
import { fetchBots } from '~/workspace/bots/reducer'

type Props = ConnectedProps<typeof connector> & { onChange: (value: Option['value']) => void }

const BotDropdown: FC<Props> = props => {
  const defaultItem: Option = { value: '*', label: lang.tr('bottomPanel.logs.allBots') }

  const [items, setItems] = useState<Option[]>([])
  const [current, setCurrent] = useState<Option>(defaultItem)

  useEffect(() => {
    if (props.bots) {
      setItems([defaultItem, ...props.bots.map(bot => ({ value: bot.id, label: bot.name }))])
    }
  }, [props.bots])

  return (
    <Dropdown
      items={items}
      defaultItem={current}
      onChange={item => {
        setCurrent(item)
        props.onChange(item.value)
      }}
    />
  )
}

const mapStateToProps = (state: AppState) => ({
  bots: state.bots.bots
})

const mapDispatchToProps = { fetchBots }
const connector = connect(mapStateToProps, mapDispatchToProps)

export default connector(BotDropdown)
