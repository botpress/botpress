import _ from 'lodash'
import React from 'react'
import { OverlayTrigger, Tooltip } from 'react-bootstrap'
import { MdErrorOutline } from 'react-icons/md'

import style from '../style.scss'

const renderWrapped = WrappedComponent => {
  const I18nComponent = props => {
    const showMissingIcon = () => {
      const { defaultLang, activeLang } = props.formContext
      if (defaultLang === activeLang) {
        return false
      }

      const isDefaultLangSet = isPropertySet(props.name + '$' + defaultLang)
      const isActiveLangSet = isPropertySet(props.name + '$' + activeLang)
      const isEmpty = !props.formData || !props.formData.length

      return isDefaultLangSet && (!isActiveLangSet || isEmpty)
    }

    const isPropertySet = propName => {
      const value = props.formContext[propName]
      if (value === undefined || (_.isArray(value) && value.length === 1 && _.every(_.values(value[0]), _.isEmpty))) {
        return false
      }

      return true
    }

    const useDefaultLangText = () => {
      const original = props.formContext[props.name + '$' + props.formContext.defaultLang]
      original && props.handleOnChange(original)
    }

    const isMissing = showMissingIcon()

    return (
      <div className={style.flexContainer}>
        <WrappedComponent {...props} />
        {isMissing && (
          <div className={style.missingIcon}>
            <OverlayTrigger
              placement="bottom"
              overlay={
                <Tooltip id="tooltip">
                  Translation missing for current language ({props.formContext.activeLang}
                  ). Click here to copy the default language text
                </Tooltip>
              }
            >
              <MdErrorOutline onClick={() => useDefaultLangText()} />
            </OverlayTrigger>
          </div>
        )}
      </div>
    )
  }

  return I18nComponent
}

export default renderWrapped
