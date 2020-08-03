import { Icon } from '@blueprintjs/core'
import cx from 'classnames'
import _ from 'lodash'
import moment from 'moment'
import React, { FC, Fragment, useState } from 'react'

import en from '../../../../../translations/en.json'
import fr from '../../../../../translations/fr.json'
import style from '../style.scss'

const translations = { fr, en }

export const Processing: FC<{ processing: { [activity: string]: Date }; lang: string }> = props => {
  const [expanded, setExpanded] = useState({})
  const { processing } = props

  const processed = Object.keys(processing)
    .map(key => {
      const [type, name, status] = key.split(':')
      return { type, name, status, completed: moment(processing[key]) }
    })
    .map((curr, idx, array) => {
      return { ...curr, execTime: idx === 0 ? 0 : curr.completed.diff(array[idx - 1].completed) }
    })
    .reduce((acc, item) => {
      const lastItem = acc.pop()
      if (lastItem?.type === item.type) {
        lastItem.subItems?.push(item)
        acc = acc.concat(lastItem)
      } else {
        if (lastItem) {
          acc = acc.concat(lastItem)
        }
        acc = acc.concat({ type: item.type, subItems: [item] })
      }
      return acc
    }, [])

  const withoutSkipped = processed.filter(x => x.status !== 'skipped')
  const totalExec = _.sumBy(withoutSkipped, x => x.execTime)

  // TODO: Better translation implementation for "lite" modules
  const lang = {
    tr: (item: string) => _.get(translations[props.lang], item) || _.get(translations['en'], item)
  }

  const renderToggleItem = (item, key) => {
    const isExpanded = expanded[key]

    return (
      <Fragment>
        <button className={style.itemButton} onClick={() => setExpanded({ ...expanded, [key]: !isExpanded })}>
          <Icon icon={isExpanded ? 'eye-off' : 'eye-open'} iconSize={10} />
          {lang.tr(`processing.${item.type}`)} {item.name}
          {item.status === 'error' && <Icon className={style.error} icon="error" iconSize={10} />}
        </button>
        {isExpanded && (
          <span className={style.expanded}>
            {/* TODO implement info box https://zpl.io/aMAOxZr
            <span className={style.infoBox}></span>
          */}
            <span className={style.time}>Executed in {item.execTime || 0} ms</span>
          </span>
        )}
      </Fragment>
    )
  }

  return (
    <div className={style.section}>
      {processed.map((item, index) => {
        const hasChildren = item.subItems?.filter(x => x.name).length
        return (
          <Fragment key={index}>
            {!item.subItems}
            <div className={cx(style.processingItem, style.processingSection)}>
              {!hasChildren && renderToggleItem({ ...item.subItems?.[0], name: item.type }, index)}
              {!!hasChildren && item.type}
            </div>
            {!!hasChildren && (
              <ul>
                {item.subItems?.map((entry, idx) => {
                  const key = `${index}-${idx}`

                  return (
                    <li className={cx(style.processingItem, { [style.error]: entry.status === 'error' })} key={key}>
                      {renderToggleItem(entry, key)}
                    </li>
                  )
                })}
              </ul>
            )}
          </Fragment>
        )
      })}
    </div>
  )
}
