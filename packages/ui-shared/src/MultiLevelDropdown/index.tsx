import { Button, Icon } from '@blueprintjs/core'
import cx from 'classnames'
import React, { FC, Fragment, useEffect, useState } from 'react'

import Overlay from '../../../ui-shared-lite/Overlay'
import confirmDialog from '../ConfirmDialog'
import { lang } from '../translations'

import style from './style.scss'
import { MultiLevelDropdownProps, Option } from './typings'

const MultiLevelDropdown: FC<MultiLevelDropdownProps> = ({
  addBtn,
  confirmChange,
  placeholder,
  filterPlaceholder,
  defaultItem,
  items,
  onChange,
  filterable
}) => {
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

  const handleOptionClick = async option => {
    if (!confirmChange) {
      updateSelectedOption(option)

      return
    }

    confirmChange.callback?.(false)

    if (
      await confirmDialog(confirmChange.message, {
        acceptLabel: confirmChange.acceptLabel
      })
    ) {
      confirmChange.callback?.(true)
      updateSelectedOption(option)
    } else {
      confirmChange.callback?.(true)
    }
  }

  const btnText = activeItem?.label || (addBtn?.selected && addBtn.text) || defaultItem?.label || placeholder
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
        className={cx(style.btn, { [style.placeholder]: !activeItem && !addBtn?.selected })}
        text={btnText}
        rightIcon={isOpen ? 'chevron-up' : 'chevron-down'}
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
                    placeholder={filterPlaceholder || lang('search')}
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
                          onClick={() => handleOptionClick(option)}
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
