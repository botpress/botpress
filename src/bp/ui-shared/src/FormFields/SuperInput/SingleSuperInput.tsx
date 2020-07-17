import { Icon } from '@blueprintjs/core'
import cx from 'classnames'
import React, { Fragment } from 'react'

import { lang } from '../../translations'
import Dropdown from '../../Dropdown'
import Icons from '../../Icons'

import style from './style.scss'
import { convertToTags } from './utils'

const isValidJson = value =>
  /^[\],:{}\s]*$/.test(
    value
      .replace(/\\["\\\/bfnrtu]/g, '@')
      .replace(/"[^"\\\n\r]*"|true|false|null|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?/g, ']')
      .replace(/(?:^|:|,)(?:\s*\[)+/g, '')
  )

const SingleSuperInput = ({ canPickEvents, events, variables, onAddVariable, eventsDesc, value, onBlur }) => {
  const getTagHtml = () => {
    let tag
    const processedValue = convertToTags(value!)
      .replace('[[', '')
      .replace(']]', '')

    if (isValidJson(processedValue)) {
      tag = value && JSON.parse(processedValue)
    }

    return (
      tag && (
        <span contentEditable={false} title={tag.value} tabIndex={-1} className="tagify__tag">
          <span>
            <Icon icon={tag.prefix === '$' ? 'dollar' : <Icons.Brackets iconSize={10} />} iconSize={10} />
            <span className="tagify__tag-text">{tag.value}</span>
          </span>
        </span>
      )
    )
  }

  const onKeyDown = e => {
    e.preventDefault()

    if (e.key === 'Backspace') {
      onBlur?.('')
    }
  }

  const filterDropdown = (query, options) => {
    const addOption = [] as any[]
    if (
      query &&
      !options.find(option => {
        return query.toLowerCase() === option.label.toLowerCase() || query.toLowerCase() === option.value
      })
    ) {
      addOption.push({
        label: query,
        type: 'add',
        value: query
      })
    }

    return [
      ...addOption,
      ...options.filter(option => `${option.label.toLowerCase()} ${option.value}`.indexOf(query.toLowerCase()) > -1)
    ]
  }

  const customItemRenderer = (option, { handleClick, modifiers }) => {
    const isAdding = option.type === 'add'

    if (!modifiers.matchesPredicate) {
      return null
    }

    const label = isAdding ? (
      <Fragment>
        <Icon icon="plus" iconSize={12} />
        {lang('create')} "{option.label}"
      </Fragment>
    ) : (
      option.label
    )

    return (
      <div
        key={option.value}
        onClick={handleClick}
        className={cx('tagify__dropdown__item', {
          [style.addingItem]: isAdding,
          ['tagify__dropdown__item--active']: modifiers.active
        })}
      >
        {label}
        <span className="description">{eventsDesc?.[option.value] || ''}</span>
      </div>
    )
  }

  return (
    <div className={style.superInputWrapper}>
      <div className={style.singularTagBtnWrapper}>
        {canPickEvents && (
          <Dropdown
            items={events.map(name => ({ value: name, label: name }))}
            icon={<Icons.Brackets />}
            filterPlaceholder={lang('search')}
            customItemRenderer={customItemRenderer}
            onChange={({ value }) => {
              onBlur?.(`{{${value}}}`)
            }}
          />
        )}
        <Dropdown
          items={variables.map(name => ({ value: name, label: name }))}
          icon="dollar"
          filterPlaceholder={lang('search')}
          filterList={filterDropdown}
          customItemRenderer={customItemRenderer}
          onChange={({ value }) => {
            onAddVariable(value, variables)
            onBlur?.(`$${value}`)
          }}
        />
      </div>
      <div className={style.superInput} onKeyDown={onKeyDown} contentEditable suppressContentEditableWarning>
        {getTagHtml()}
      </div>
    </div>
  )
}

export default SingleSuperInput
