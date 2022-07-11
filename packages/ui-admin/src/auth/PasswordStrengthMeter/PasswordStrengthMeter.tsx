import { ProgressBar } from '@blueprintjs/core'
import { lang } from 'botpress/shared'
import cx from 'classnames'
import React, { useState, Suspense } from 'react'
// Notice that we lazy load the progress bar as zxcvbn is quite heavy
// and can impact load time on slower network conditions
const LazyPogressBar = React.lazy(() => import('./ZXCVBNProgressBar'))

import style from '../style.scss'

const NOT_SET = -1

interface Props {
  pwdCandidate: string
}

export const PasswordStrengthMeter = (props: Props) => {
  const [strengthScore, setStrengthScore] = useState(NOT_SET)

  return (
    <React.Fragment>
      <Suspense fallback={<ProgressBar className={style.strengthProgress} animate={false} stripes={false} value={0} />}>
        <LazyPogressBar pwdCandidate={props.pwdCandidate} onStrengthScoreChange={setStrengthScore} />
      </Suspense>
      <div className={style.strengthDetails}>
        <p>{lang.tr('admin.passwordStrength.hint')}</p>
        <div className={cx(style.strenghtLabel, style[`_${strengthScore}`])}>
          {lang.tr(`admin.passwordStrength.${strengthScore}`)}
        </div>
      </div>
    </React.Fragment>
  )
}
