import { Button, ButtonGroup, Intent } from '@blueprintjs/core'
import range from 'lodash/range'
import uniq from 'lodash/uniq'
import React from 'react'

const buildPager = ({ pagesCount, currentPage, depth = 5 }) => {
  const pageNumbers = uniq(
    [0, pagesCount - 1, ...range(currentPage - depth, currentPage + depth + 1)].filter(n => n >= 0 && n < pagesCount)
  ).sort((a, b) => a - b)

  const pager = []

  for (let i = 0; i < pageNumbers.length; i++) {
    if (i > 0 && pageNumbers[i] !== pageNumbers[i - 1] + 1) {
      pager.push({ ellipsis: true })
    }
    pager.push({
      index: pageNumbers[i],
      displayIndex: pageNumbers[i] + 1,
      isCurrent: pageNumbers[i] === currentPage
    })
  }

  return pager
}

const Pager = ({ pagesCount, currentPage, depth = 5, goTo }) => {
  if (pagesCount <= 1) {
    return null
  }

  const pager = buildPager({ pagesCount, currentPage, depth })

  return (
    <div>
      <ButtonGroup>
        <Button disabled={currentPage === 0} onClick={() => goTo(currentPage - 1)}>
          &lt;
        </Button>
        {pager.map((el, i) => (
          <Button
            key={i}
            intent={el.isCurrent ? Intent.PRIMARY : Intent.NONE}
            onClick={el.isCurrent ? undefined : () => goTo(el.index)}
            disabled={el.ellipsis}
          >
            {el.ellipsis ? <>&hellip;</> : el.displayIndex}
          </Button>
        ))}
        <Button disabled={currentPage === pagesCount - 1} onClick={() => goTo(currentPage + 1)}>
          &gt;
        </Button>
      </ButtonGroup>
    </div>
  )
}

export default Pager
