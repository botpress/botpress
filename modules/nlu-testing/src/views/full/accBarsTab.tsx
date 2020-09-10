import _ from 'lodash'
import React, { FC, Fragment } from 'react'
import Plots from './plots'
import { VisData } from '../../shared/typings'

const AccBars: FC<any> = props => {
  const getXY = (key: string) => {
    const datas: VisData[] = props.dataResult[key]
    const XYLabel = {}
    for (const entry of datas) {
      const label = _.get(XYLabel, `${entry.expected}`, { total: 0, pass: 0 })
      label.total += 1
      label.pass += +(entry.predicted === entry.expected)
      XYLabel[entry.expected] = label
    }
    const x = Object.keys(XYLabel)
    const y = Object.values(XYLabel).map((l: { total: number; pass: number }) => l.pass / l.total)

    return { x, y }
  }

  return (
    <Fragment>
      {props.dataResult.intent.length > 0 && (
        <Plots data={[{ ...getXY('intent'), type: 'bar' }]} title={'Accuracy of each intents'} />
      )}
      {props.dataResult.context.length > 0 && (
        <Plots data={[{ ...getXY('context'), type: 'bar' }]} title={'Accuracy of each contexts'} />
      )}
      {props.dataResult.slot.length > 0 && (
        <Plots data={[{ ...getXY('slot'), type: 'bar' }]} title={'Accuracy of each slots'} />
      )}
      {props.dataResult.slotCount.length > 0 && (
        <Plots data={[{ ...getXY('slotCount'), type: 'bar' }]} title={'Accuracy of each slot count'} />
      )}
    </Fragment>
  )
}

export default AccBars
