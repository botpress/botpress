import * as React from 'react'
import ReactTooltip from 'react-tooltip'
import _ from 'lodash'
import { getColorByPercent } from './gradient'

import './styles.css'

function Cell(props) {
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

function MatrixComponent(props) {
  let matrix = props.matrix
  matrix = { ...matrix }
  delete matrix.all

  // navigate all classes and give them an idx
  const orderedNames = _.chain(matrix)
    .keys()
    .filter(x => x !== 'none')
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

    const body = (
      <React.Fragment>
        <a data-tip data-for={'cls-' + key}>
          {v.f1.toFixed(1)}
        </a>
        <ReactTooltip id={'cls-' + key} effect="solid">
          <h3>{key}</h3>
          <ul>
            <li>
              <strong>F1: </strong>
              {v.f1.toFixed(2)}
            </li>
            <li>
              <strong>Precision: </strong>
              {v.precision.toFixed(2)}
            </li>
            <li>
              <strong>Recall: </strong>
              {v.recall.toFixed(2)}
            </li>
          </ul>
          <ul>
            <li>
              <strong>False Positives: </strong>
              {v.fp}
            </li>
            <li>
              <strong>False Negatives: </strong>
              {v.fn - noneConfusions}
            </li>
            {noneConfusions ? (
              <li>
                <strong>Not found (none):</strong> {noneConfusions}
              </li>
            ) : null}
          </ul>
        </ReactTooltip>
      </React.Fragment>
    )

    cols[idxByName[key]] = (
      <Cell className="identity" scoreInPercent={v.f1 || 0}>
        {body}
      </Cell>
    )

    for (let cls of Object.keys(v.confusions || []).filter(x => x !== 'none')) {
      if (idxByName[cls] > idxByName[key]) {
        continue
      }

      const tipKey = `cls-${key}--vs--${cls}`
      let nConfusions = (v.confusions || [])[cls] + ((matrix[cls].confusions || {})[key] || 0)

      const body = (
        <React.Fragment>
          <a data-tip data-for={tipKey}>
            {nConfusions}
          </a>
          <ReactTooltip id={tipKey} effect="solid">
            <h3>{key}</h3>
            <p>
              The model got confused <strong>{nConfusions}</strong> times with the <strong>{cls}</strong> intent.
            </p>
          </ReactTooltip>
        </React.Fragment>
      )

      cols[idxByName[cls]] = <Cell scoreInAbsolute={nConfusions}>{body}</Cell>
    }

    return <tr>{cols}</tr>
  })

  return (
    <div>
      <div>
        <table className="matrix">{rows}</table>
      </div>
    </div>
  )
}

function Details(data) {
  return (
    <div>
      <div className="App">
        {_.map(data, (matrix, index) => (
          <MatrixComponent matrix={matrix} name={index} />
        ))}
      </div>
    </div>
  )
}

export default Details
