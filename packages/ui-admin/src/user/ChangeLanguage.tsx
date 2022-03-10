import { Button, FormGroup, Intent } from '@blueprintjs/core'
import { Dialog, Dropdown, lang, Option } from 'botpress/shared'
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
    <Dialog.Wrapper
      title={lang.tr('admin.changeLanguage')}
      icon="translate"
      isOpen={props.isOpen}
      onClose={props.toggle}
      onSubmit={submit}
    >
      <Dialog.Body>
        <FormGroup label={lang.tr('admin.uiLanguage')} helperText={lang.tr('admin.uiLanguageHelper')}>
          <Dropdown items={languages} defaultItem={language} onChange={setLanguage} />
        </FormGroup>
      </Dialog.Body>
      <Dialog.Footer>
        <Button
          id="btn-submit-change-language"
          type="submit"
          text={lang.tr('save')}
          tabIndex={4}
          intent={Intent.PRIMARY}
        />
      </Dialog.Footer>
    </Dialog.Wrapper>
  )
}

export default ChangeLanguage
