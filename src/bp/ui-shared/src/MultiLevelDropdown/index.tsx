import { Button, Classes, Icon, MenuItem } from '@blueprintjs/core'
import cx from 'classnames'
import { FC, useState } from 'react'
import React from 'react'
import { useEffect } from 'react'
import { Fragment } from 'react'

import Overlay from '../../../ui-shared-lite/Overlay'
import { contentTypeField } from '../FormFields/VariablePicker/style.scss'

import style from './style.scss'
import { MultiLevelDropdownProps, Option } from './typings'

const itemRenderer = (option, { modifiers, handleClick }) => {
  if (!modifiers.matchesPredicate) {
    return null
  }

  return (
    <MenuItem
      className={Classes.SMALL}
      active={modifiers.active}
      disabled={modifiers.disabled}
      key={option.label || option}
      onClick={handleClick}
      text={option.label || option}
      icon={option.icon}
    />
  )
}

const MultiLevelDropdown: FC<MultiLevelDropdownProps> = props => {
  const {
    addBtn,
    placeholder,
    filterPlaceholder,
    confirmChange,
    defaultItem,
    items,
    onChange,
    small,
    icon,
    rightIcon,
    children,
    spaced,
    className,
    filterable,
    filterList,
    customItemRenderer
  } = props
  const [activeItem, setActiveItem] = useState<Option | undefined>()
  const [isOpen, setIsOpen] = useState(false)
  const [searchValue, setSearchValue] = useState('')
  const [expanded, setExpanded] = useState({})

  useEffect(() => {
    setActiveItem(defaultItem)
    const parent = items.find(x => x.items.some(item => item.value === defaultItem?.value))

    if (parent) {
      setExpanded({ ...expanded, [parent.name]: true })
    }
  }, [defaultItem])

  const updateSelectedOption = option => {
    onChange(option)
    setActiveItem(option)
    setIsOpen(false)
  }

  const btnText = activeItem?.label || defaultItem?.label || placeholder

  const filterItem = item => `${item.label}//${item.value}`.toLowerCase().includes(searchValue)

  const filteredItems = items.filter(x => x.name.toLowerCase().includes(searchValue) || x.items.some(filterItem))

  const onKeyDown = e => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'a') {
      e.preventDefault()
      e.target.select()
    }
  }

  const handleAddBtnClick = () => {
    setIsOpen(false)
    addBtn?.onClick()
  }

  return (
    <div className={cx(style.dropdown)}>
      <Button
        onClick={() => setIsOpen(!isOpen)}
        className={cx(style.btn, { [style.spaced]: spaced, [style.placeholder]: !activeItem })}
        text={small ? <small>{btnText}</small> : btnText}
        rightIcon={isOpen ? 'chevron-up' : 'chevron-down'}
        small={small}
      />
      {isOpen && (
        <Fragment>
          <ul className={style.select}>
            {filterable && (
              <li>
                <div className={style.search}>
                  <Icon icon="search" />
                  <input
                    type="text"
                    onKeyDown={onKeyDown}
                    onChange={({ currentTarget: { value } }) => setSearchValue(value)}
                    value={searchValue}
                  />
                </div>
              </li>
            )}
            {addBtn && (
              <li>
                <Button minimal className={style.addBtn} icon="plus" text={addBtn.text} onClick={handleAddBtnClick} />
              </li>
            )}
            {filteredItems.map(({ name, items: options }) => (
              <li key={name}>
                <button
                  className={style.selectItem}
                  onClick={() => setExpanded({ ...expanded, [name]: !expanded[name] })}
                >
                  <Icon icon={expanded[name] ? 'chevron-down' : 'chevron-right'} />
                  {name}
                </button>
                {expanded[name] && (
                  <ul>
                    {options.filter(filterItem).map(option => (
                      <li key={option.value}>
                        <button
                          onClick={() => updateSelectedOption(option)}
                          className={cx(style.selectItem, { [style.active]: option.value === activeItem?.value })}
                        >
                          {option.label}
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </li>
            ))}
          </ul>
          <Overlay onClick={() => setIsOpen(false)} />
        </Fragment>
      )}
    </div>
  )
}

export default MultiLevelDropdown
