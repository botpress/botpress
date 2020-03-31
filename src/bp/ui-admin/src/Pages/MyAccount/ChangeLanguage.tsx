import { Button, Classes, Dialog, FormGroup, Intent } from '@blueprintjs/core'
import { lang } from 'botpress/shared'
import React, { FC, useState } from 'react'
import Select from 'react-select'
import { toastFailure, toastSuccess } from '~/utils/toaster'

interface Props {
  isOpen: boolean
  toggle: () => void
}

interface SelectItem {
  value: string
  label: string
}

const ChangeLanguage: FC<Props> = props => {
  const languages: SelectItem[] = [
    { value: 'en', label: 'English' },
    { value: 'fr', label: 'Français' }
  ]

  const [language, setLanguage] = useState<SelectItem>(getCurrentLanguage())

  const submit = async event => {
    event.preventDefault()
    localStorage.setItem('uiLanguage', language.value)
    window.location.reload()
  }

  function getCurrentLanguage(): SelectItem {
    const locale = lang.locale()
    const option = languages.find(x => x.value === locale)
    if (option === undefined) {
      return languages[0]
    } else {
      return option
    }
  }
  const languageChanged = language => {
    setLanguage(language)
  }

  return (
    <Dialog
      title={lang.tr('admin.changeLanguage')}
      icon="translate"
      isOpen={props.isOpen}
      onClose={props.toggle}
      transitionDuration={0}
      canOutsideClickClose={false}
    >
      <form onSubmit={submit}>
        <div className={Classes.DIALOG_BODY}>
          <FormGroup label={lang.tr('admin.uiLanguage')} helperText={lang.tr('admin.uiLanguageHelper')}>
            <Select options={languages} value={language} onChange={languageChanged} />
          </FormGroup>
        </div>

        <div className={Classes.DIALOG_FOOTER}>
          <div className={Classes.DIALOG_FOOTER_ACTIONS}>
            <Button id="btn-submit" type="submit" text={lang.tr('save')} tabIndex={4} intent={Intent.PRIMARY} />
          </div>
        </div>
      </form>
    </Dialog>
  )
}

export default ChangeLanguage
