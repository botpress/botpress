import _ from 'lodash'
import React, { FC, Fragment, useEffect, useState } from 'react'

import Plots from './plots'

const ConfusionMatrix: FC<any> = props => {
  const [intentCM, setIntentCM] = useState([])
  const [contextCM, setContextCM] = useState([])
  const [slotCM, setSlotCM] = useState([])
  const [slotCountCM, setSlotCountCM] = useState([])

  const createConfusionMatrix = (matrixType: 'slot' | 'intent' | 'context' | 'slotCount') => {
    const datas: { predicted: string; expected: string }[] = props.dataResult[matrixType]

    if (datas.length < 1) {
      return []
    }

    const confusionMatrix = {}
    const allLabels = Array.from(new Set(datas.map(o => o.predicted).concat(datas.map(o => o.expected))))

    for (const label of allLabels) {
      confusionMatrix[label] = {}
      for (const subLabel of allLabels) {
        confusionMatrix[label][subLabel] = 0
      }
    }

    for (const entry of datas) {
      confusionMatrix[entry.predicted][entry.expected] += 1
    }

    const arrayConfusionMatrix = []
    for (const label of allLabels) {
      const numberRow = []
      for (const subLabel of allLabels) {
        numberRow.push(confusionMatrix[label][subLabel])
      }
      arrayConfusionMatrix.push(numberRow)
    }

    const transposedConfusionMatrix = arrayConfusionMatrix[0].map((_, colIndex) =>
      arrayConfusionMatrix.map(row => row[colIndex])
    )

    const transposedNormalisedConfusionMatrix = transposedConfusionMatrix.map(row => {
      const sumRow = _.sum(row)
      return row.map(elt => _.round(elt / (sumRow + Number.EPSILON), 2))
    })

    const matrix = [
      {
        x: allLabels,
        y: allLabels,
        z: transposedNormalisedConfusionMatrix,
        type: 'heatmap'
      }
    ]

    return matrix
  }

  useEffect(() => {
    setIntentCM(createConfusionMatrix('intent'))
    setContextCM(createConfusionMatrix('context'))
    setSlotCM(createConfusionMatrix('slot'))
    setSlotCountCM(createConfusionMatrix('slotCount'))
  }, [props.dataResult])

  if (!props.dataResult) {
    return <h3>Please run the intent test first</h3>
  }

  const { intent, context, slot, slotCount } = props.dataResult

  return (
    <Fragment>
      {intent.length > 0 && <Plots data={intentCM} title={'Intents from nlu-tests confusion matrix'} />}
      {context.length > 0 && <Plots data={contextCM} title={'Contexts from nlu-tests confusion matrix'} />}
      {/* {slot.length > 0 && <Plots data={slotCM} title={'Slots from nlu-tests confusion matrix'} />} */}
      {/* {slotCount.length > 0 && <Plots data={slotCountCM} title={'Slot count from nlu-tests confusion matrix'} />} */}
    </Fragment>
  )
}

export default ConfusionMatrix
