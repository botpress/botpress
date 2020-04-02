import { Button, FormGroup, Intent } from '@blueprintjs/core'
import { BaseDialog, DialogBody, DialogFooter, Dropdown, lang, Option } from 'botpress/shared'
import React, { FC, useState } from 'react'

interface Props {
  isOpen: boolean
  toggle: () => void
}

const ChangeLanguage: FC<Props> = props => {
  const languages: Option[] = lang.getAvailable().map<Option>(x => ({ value: x, label: lang.tr(`langCodes.${x}`) }))

  const [language, setLanguage] = useState<Option>(getCurrentLanguage())

  function submit() {
    localStorage.setItem('uiLanguage', language.value)
    window.location.reload()
  }

  function getCurrentLanguage(): Option {
    const locale = lang.getLocale()
    const option = languages.find(x => x.value === locale)
    if (option === undefined) {
      return languages[0]
    } else {
      return option
    }
  }

  return (
    <BaseDialog
      title={lang.tr('admin.changeLanguage')}
      icon="translate"
      isOpen={props.isOpen}
      onClose={props.toggle}
      onSubmit={submit}
    >
      <DialogBody>
        <FormGroup label={lang.tr('admin.uiLanguage')} helperText={lang.tr('admin.uiLanguageHelper')}>
          <Dropdown items={languages} defaultItem={language} onChange={setLanguage} />
        </FormGroup>
      </DialogBody>
      <DialogFooter>
        <Button id="btn-submit" type="submit" text={lang.tr('save')} tabIndex={4} intent={Intent.PRIMARY} />
      </DialogFooter>
    </BaseDialog>
  )
}

export default ChangeLanguage
