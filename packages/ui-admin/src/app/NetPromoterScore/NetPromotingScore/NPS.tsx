import { lang } from 'botpress/shared'
import React, { ReactNode } from 'react'
import NPSScale from './components/NPSScale'
import styles from './style.scss'

interface Props {
  animated?: boolean
  dismissed?: boolean
  score?: number | null
  question?: string
  scaleWorstLabel?: string
  scaleBestLabel?: string
  onSubmit?: (score: number) => void
  onDismissed?: () => void
  children?: ReactNode
}
export function NPS({
  animated = true,
  question = lang.tr('admin.netPromotingScore.question'),
  dismissed,
  score = null,
  scaleWorstLabel,
  scaleBestLabel,
  onSubmit,
  onDismissed,
  children = <p>{lang.tr('admin.netPromotingScore.feedback')}</p>
}: Props) {
  const handleDismiss = () => {
    onDismissed && onDismissed()
  }
  const handleSubmit = (score: number) => {
    onSubmit && onSubmit(score)
  }

  return dismissed ? null : (
    <div className={`${styles.root} ${animated ? styles.animated : ''}`}>
      <button className={styles.close} onClick={handleDismiss}>
        ✕
      </button>

      {score ? (
        <div className={styles.inner}>{children}</div>
      ) : (
        <div className={styles.inner}>
          <p className={styles.message}>{question}</p>
          <NPSScale worstLabel={scaleWorstLabel} bestLabel={scaleBestLabel} score={score} onSubmit={handleSubmit} />
        </div>
      )}
    </div>
  )
}
