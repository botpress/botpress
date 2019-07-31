import { Position, Tooltip } from '@blueprintjs/core'
import * as React from 'react'
import _ from 'lodash'

import { getColorByPercent } from './gradient'
import './styles.css'

const Cell = props => {
  let { scoreInPercent, scoreInAbsolute } = props
  let cls = 'none'
  let style = {}

  if (scoreInAbsolute) {
    scoreInPercent = 1 - (Math.min(0.9, scoreInAbsolute / 6) + 0.1)
  }

  if (typeof scoreInPercent === 'number') {
    cls = null
    style = { backgroundColor: getColorByPercent(scoreInPercent) }
  }

  return (
    <td className={props.className}>
      <span style={style} className={cls && `color-${cls}`}>
        {props.children}
      </span>
    </td>
  )
}

const MatrixComponent = ({ context, matrix }) => {
  // navigate all classes and give them an idx
  const orderedNames = _.chain(matrix)
    .keys()
    .filter(x => x !== 'none' && x !== 'all')
    .orderBy(x => matrix[x].f1, 'asc')
    .value()

  const idxByName = _.mapValues(matrix, (v, key) => orderedNames.indexOf(key))
  const size = Object.keys(idxByName).length

  const rows = _.map(orderedNames, key => {
    const v = matrix[key]

    if (key === 'none') {
      return null
    }

    const cols = new Array(size).fill(<Cell className="no-confusion">0</Cell>, 0, idxByName[key])

    cols[idxByName[key] + 1] = (
      <td className="name">
        <span>{key}</span>
      </td>
    )

    const noneConfusions = v.confusions.none || 0

    const toolTipContent = (
      <div className="smallTooltip">
        <div>
          <label>F1: </label>
          <strong>{v.f1.toFixed(2)}</strong>
        </div>
        <div>
          <label>Precision: </label>
          <strong>{v.precision.toFixed(2)}</strong>
        </div>
        <div>
          <label>Recall: </label>
          <strong>{v.recall.toFixed(2)}</strong>
        </div>
        <br />
        <div>
          <label>False Positives:</label>
          <strong>{v.fp}</strong>
        </div>
        <div>
          <label>False Negatives:</label>
          <strong>{v.fn - noneConfusions}</strong>
        </div>
        {noneConfusions && (
          <div>
            <label>Not found (none):</label>
            <strong>{noneConfusions}</strong>
          </div>
        )}
      </div>
    )

    cols[idxByName[key]] = (
      <Cell className="identity" scoreInPercent={v.f1 || 0}>
        <Tooltip content={toolTipContent} position={Position.TOP}>
          <a data-tip data-for={'cls-' + key}>
            {v.f1.toFixed(1)}
          </a>
        </Tooltip>
      </Cell>
    )

    for (const cls of Object.keys(v.confusions || []).filter(x => x !== 'none')) {
      if (idxByName[cls] > idxByName[key]) {
        continue
      }

      const tipKey = `cls-${key}--vs--${cls}`
      const nConfusions = (v.confusions || [])[cls] + ((matrix[cls].confusions || {})[key] || 0)

      const content = (
        <div className="smallTooltip">
          The model got confused <strong>{nConfusions}</strong> times with the <strong>{cls}</strong> intent.
        </div>
      )

      cols[idxByName[cls]] = (
        <Cell scoreInAbsolute={nConfusions}>
          <Tooltip content={content} position={Position.TOP}>
            <a data-tip data-for={tipKey}>
              {nConfusions}
            </a>
          </Tooltip>
        </Cell>
      )
    }

    return <tr>{cols}</tr>
  })

  return (
    <div>
      <div style={{ textAlign: 'left' }}>Context: {context}</div>
      <table className="matrix">{rows}</table>
    </div>
  )
}

const Details = data => (
  <div>
    <div className="App">
      {_.chain(data.data)
        .map((matrix, context) => <MatrixComponent context={context} matrix={matrix} />)
        .value()}
    </div>
  </div>
)

export default Details
