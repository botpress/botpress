import { Popover, Button, Position, PopoverInteractionKind, Menu, Colors } from '@blueprintjs/core'
import React, { useEffect, FC } from 'react'
import { connect, ConnectedProps } from 'react-redux'

import { AppState } from '../rootReducer'
import { setContentLang } from '../uiReducer'
import style from './style.scss'

const requireFlag = code => {
  try {
    const flag = require(`../../management/languages/flags/${code}.svg`)
    return flag.default || flag
  } catch (err) {
    if (code === 'missing') {
      return null
    }

    return requireFlag('missing')
  }
}

const STORAGE_KEY = `bp::${window.BOT_ID}::cmsLanguage`

type Props = ConnectedProps<typeof connector> & {
  languages: string[]
}

const LangSwitcher: FC<Props> = props => {
  useEffect(() => {
    restoreLastLanguage()
  }, [props.languages])

  const restoreLastLanguage = () => {
    const lastLang = localStorage.getItem(STORAGE_KEY)
    if (!props.languages?.length || !lastLang) {
      return
    }

    if (props.languages.includes(lastLang)) {
      props.setContentLang(lastLang)
    }
  }

  const switchLang = lang => {
    props.setContentLang(lang)
    localStorage.setItem(STORAGE_KEY, lang)
  }

  if (!props.languages || !props.languages.length) {
    return null
  }

  return (
    <Popover minimal position={Position.TOP} interactionKind={PopoverInteractionKind.CLICK}>
      <Button
        id="btn-menu-lang"
        icon={<img src={requireFlag(props.contentLang)} alt={props.contentLang} className={style.flag} />}
        text={props.contentLang?.toUpperCase()}
        style={{ color: Colors.GRAY1 }}
        minimal
      />
      <Menu className={style.menu}>
        {props.languages.map((lang, idx) => (
          <Menu.Item
            key={lang}
            onClick={() => switchLang(lang)}
            icon={<img src={requireFlag(lang)} alt={lang} className={style.flag} />}
            text={<span>{lang.toUpperCase()}</span>}
          />
        ))}
      </Menu>
    </Popover>
  )
}

const mapStateToProps = (state: AppState) => ({
  contentLang: state.ui.contentLang
})

const connector = connect(mapStateToProps, { setContentLang })
export default connector(LangSwitcher)
