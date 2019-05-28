import { Pre, H5 } from '@blueprintjs/core'
import { formatConfidence } from '../utils'
import style from '../style.scss'

export const Suggestions = props => {
  const suggestions = props.suggestions
  if (!suggestions || !suggestions.length) {
    return null
  }

  return (
    <div className={style.block}>
      <H5>Suggestions</H5>
      <Pre>
        <ul>
          {suggestions.map(suggest => {
            return (
              <li key={suggest}>
                {formatConfidence(suggest.confidence)}
                %: {suggest.sourceDetails}
              </li>
            )
          })}
        </ul>
      </Pre>
    </div>
  )
}
