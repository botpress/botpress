import { lang } from 'botpress/shared'
import React from 'react'
import styles from './style.scss'

const MIN = 0
const MAX = 10

interface Props {
  score: number | null
  worstLabel?: string
  bestLabel?: string
  onSubmit?: (value: number) => void
}
export default function NPSScale({
  score,
  worstLabel = lang.tr('admin.netPromotingScore.worstLabel'),
  bestLabel = lang.tr('admin.netPromotingScore.bestLabel'),
  onSubmit
}: Props) {
  const [npsScore, setNpsScore] = React.useState<number | null>(score)
  const handleMouseEnter = (value: number) => {
    setNpsScore(value)
  }
  const handleMouseLeave = () => {
    setNpsScore(null)
  }
  const handleClick = (value: number) => {
    onSubmit && onSubmit(value)
  }
  return (
    <div className={styles.root}>
      <div>
        {range(MIN, MAX).map(i => (
          <div
            key={i}
            className={`${styles.value} ${npsScore !== null && npsScore >= i ? styles.selected : ''}`}
            onMouseEnter={() => handleMouseEnter(i)}
            onMouseLeave={handleMouseLeave}
            onClick={() => handleClick(i)}
          >
            <div>{i}</div>
          </div>
        ))}
      </div>
      <div className={styles.legend}>
        <div className={`${styles.label} ${styles.left}`}>{worstLabel}</div>
        <div className={`${styles.label} ${styles.right}`}>{bestLabel}</div>
      </div>
    </div>
  )
}

function range(start: number, end: number) {
  return Array.from({ length: end - start + 1 }).map((_, idx) => start + idx)
}
