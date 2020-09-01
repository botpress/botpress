import _ from 'lodash'
import React, { FC, Fragment, useEffect, useState } from 'react'

import Plots from './plots'

const ConfusionMatrix: FC<any> = props => {
  const [CF, setCF] = useState({ intent: [], context: [], slot: [], slotCount: [] })

  const createCM = (matrixType: 'slot' | 'intent' | 'context' | 'slotCount') => {
    const datas: { pred: string; gt: string }[] = props.dataResult[matrixType]
    if (datas.length < 1) {
      return []
    }
    const CM = {}
    const allLabels = Array.from(new Set(datas.map(o => o.pred).concat(datas.map(o => o.gt))))
    for (const label of allLabels) {
      CM[label] = {}
      for (const subLabel of allLabels) {
        CM[label][subLabel] = 0
      }
    }

    for (const entry of datas) {
      CM[entry.pred][entry.gt] += 1
    }

    const z = []
    for (const label of allLabels) {
      const numberRow = []
      for (const subLabel of allLabels) {
        numberRow.push(CM[label][subLabel])
      }
      z.push(numberRow)
    }

    const zTranspose = z[0].map((_, colIndex) => z.map(row => row[colIndex]))
    const zTransposeNorm = zTranspose.map(row => {
      const sumRow = _.sum(row)
      return row.map(elt => _.round(elt / (sumRow + Number.EPSILON), 2))
    })

    const matrix = [
      {
        x: allLabels,
        y: allLabels,
        z: zTransposeNorm,
        type: 'heatmap'
      }
    ]
    return matrix
  }

  useEffect(() => {
    const intentCF = createCM('intent')
    const contextCF = createCM('context')
    const slotCF = createCM('slot')
    const slotCountCF = createCM('slotCount')
    setCF({ intent: intentCF, context: contextCF, slot: slotCF, slotCount: slotCountCF })
  }, [props.dataResult])

  if (!props.dataResult) {
    return <h3>Please run the intent test first</h3>
  } else {
    return (
      <Fragment>
        {props.dataResult.intent.length > 0 && (
          <Plots data={CF.intent} title={'Intents from nlu-tests confusion matrix'} />
        )}
        {props.dataResult.context.length > 0 && (
          <Plots data={CF.context} title={'Contexts from nlu-tests confusion matrix'} />
        )}
        {props.dataResult.slot.length > 0 && <Plots data={CF.slot} title={'Slots from nlu-tests confusion matrix'} />}
        {false && <Plots data={CF.slotCount} title={'Slot count from nlu-tests confusion matrix'} />}
      </Fragment>
    )
  }
}
export default ConfusionMatrix
