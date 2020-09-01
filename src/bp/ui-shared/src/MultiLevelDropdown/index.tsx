import { Button, Classes, Icon, MenuItem } from '@blueprintjs/core'
import cx from 'classnames'
import { FC, useState } from 'react'
import React from 'react'
import { useEffect } from 'react'

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
        <ul className={style.select}>
          {items.map(({ name, items: options }) => (
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
                  {options.map(option => (
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
      )}
    </div>
  )
}

export default MultiLevelDropdown
