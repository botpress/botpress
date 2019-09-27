import { Button, MenuItem } from '@blueprintjs/core'
import { Select } from '@blueprintjs/select'
import countriesList from 'countries-list'
import React from 'react'

// TODO: put more meaningful overrides here
// put `false` to prevent showing a flag for languages where
// it cannot be logically determined
const KNOWN_LANGUAGES = {
  en: 'GB'
}

interface LanguageDetails {
  code: string
  name: string
  flag: string | null
}

const getLanguageDetails = (code: string): LanguageDetails => {
  const langData = countriesList.languages[code]
  if (!langData) {
    return null
  }
  let country
  const knownCountryCode = KNOWN_LANGUAGES[code]
  if (knownCountryCode) {
    country = countriesList.countries[knownCountryCode]
  } else if (knownCountryCode !== false) {
    const countries = Object.values(countriesList.countries).filter(({ languages }) => languages.includes(code))
    countries.sort((a, b) => a.languages.length - b.languages.length)
    country = countries[0]
  }

  return {
    code,
    name: langData.name,
    flag: country ? country.emoji : null
  }
}

const LanguageSelect = Select.ofType<string>()

interface LanguageSwitchProps {
  languages: string[]
  language: string
  onChage: (language: string) => void
}

class LanguageSwitch extends React.Component<LanguageSwitchProps> {
  render() {
    const { languages, language, onChage } = this.props
    const currentLangDetails = getLanguageDetails(language)
    return (
      <LanguageSelect
        onItemSelect={onChage}
        items={languages}
        activeItem={language}
        filterable={false}
        itemRenderer={(code, { handleClick, modifiers: { active } }) => {
          const langDetails = getLanguageDetails(code)
          return (
            <MenuItem
              key={code}
              active={active}
              onClick={handleClick}
              text={
                <>
                  {langDetails.flag && <>{langDetails.flag}&nbsp;</>}
                  {langDetails.name}
                </>
              }
            />
          )
        }}
        popoverProps={{ minimal: true }}
      >
        <Button
          text={
            <>
              {currentLangDetails.flag && <>{currentLangDetails.flag}&nbsp;</>}
              {currentLangDetails.name}
            </>
          }
          rightIcon="double-caret-vertical"
        />
      </LanguageSelect>
    )
  }
}

// <div>
//   <select defaultValue={defaultLanguage}>
//     {languages.map(getLanguageDetails).map(({ code, name, flag }) => (
//       <option key={code} value={code}>
//         {flag ? <>{flag}&nbsp;</> : null}
//         {name}
//       </option>
//     ))}
//   </select>
// </div>

export default LanguageSwitch
