import { ProgressBar } from '@blueprintjs/core'
import { zxcvbn, zxcvbnOptions } from '@zxcvbn-ts/core'
import zxcvbnCommonPackage from '@zxcvbn-ts/language-common'
import zxcvbnEnPackage from '@zxcvbn-ts/language-en'
import cx from 'classnames'
import { debounce } from 'lodash'
import React, { useState, useEffect, useCallback } from 'react'

import style from '../style.scss'

const TOP_SCORE = 4
const NOT_SET = -1

interface Props {
  pwdCandidate: string
  onStrengthScoreChange?: (score: number) => void
}

const SpecialCharRE = /(\¿|\÷|\≥|\≤|\µ|\˜|\∫|\√|\≈|\æ|\…|\¬|\˚|\˙|\©|\+|\-|\_|\!|\@|\#|\$|\%|\?|\&|\*|\(|\)|\/|\\|\[|\]|\{|\}|\:|\;|\<|\>|\=|\.|\,|\~|\`|\"|\'|\s)/gi

const options = {
  translations: zxcvbnEnPackage.translations,
  graphs: zxcvbnCommonPackage.adjacencyGraphs,
  dictionary: {
    ...zxcvbnCommonPackage.dictionary,
    ...zxcvbnEnPackage.dictionary
  }
}

zxcvbnOptions.setOptions(options)

export default (props: Props) => {
  const [strengthScore, setStrengthScore] = useState(NOT_SET)

  const computeZXCVBNScore = useCallback(
    debounce((pwd: string, currentScore: number) => {
      let newScore = pwd.length > 0 ? zxcvbn(pwd).score : NOT_SET
      if (newScore === TOP_SCORE) {
        //patch to be a more compliant with our strong pwd policy
        newScore = SpecialCharRE.test(pwd) ? newScore : TOP_SCORE - 1
      }
      if (currentScore !== newScore) {
        setStrengthScore(newScore)
        props.onStrengthScoreChange?.(newScore)
      }
    }, 200),
    []
  )

  useEffect(() => {
    computeZXCVBNScore(props.pwdCandidate, strengthScore)
  }, [props.pwdCandidate])

  const progress = strengthScore === NOT_SET ? 0 : (strengthScore + 1) / (TOP_SCORE + 1)

  return (
    <ProgressBar
      animate={false}
      stripes={false}
      value={progress}
      className={cx(style.strengthProgress, style[`_${strengthScore}`])}
    />
  )
}
