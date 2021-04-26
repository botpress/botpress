import { Button, Intent, Position, Tooltip } from '@blueprintjs/core'
import { lang, FileDisplay, UploadFieldProps } from 'botpress/shared'
import React, { FC, Fragment, useEffect, useState } from 'react'
import SmartInput from '~/components/SmartInput'
import style from '~/views/FlowBuilder/sidePanelTopics/form/style.scss'

import localStyle from './style.scss'

interface IUrlUploadProps {
  value: string | null
  type: UploadFieldProps['type']
  onChange(value: string | null): void
  onDelete(): void
  onError(value: string | Error): void
}

const UrlUpload: FC<IUrlUploadProps> = props => {
  const { value, type } = props

  const [url, setUrl] = useState(props.value)

  useEffect(() => {
    setUrl(value)
  }, [value])

  const handleUrlChange = (str: string) => {
    setUrl(str)
  }

  const onDelete = () => {
    setUrl(null)
    props.onDelete()
  }

  const saveUrl = () => {
    props.onChange(url)
  }

  const isUrlOrRelativePath = (str: string) => {
    const re = /^(?:[a-z]+:)?\/\/|^\//i

    return re.test(str)
  }

  return (
    <div className={style.fieldWrapper}>
      {value && isUrlOrRelativePath(value) && <FileDisplay url={value} type={type} onDelete={onDelete} deletable />}

      {value && !isUrlOrRelativePath(value) && (
        <div className={localStyle.expressionWrapper}>
          {lang.tr('module.builtin.types.infoInterpreted')} <span className={localStyle.italic}>{value}</span>
          <div className={localStyle.expressionWrapperActions}>
            <Tooltip content={lang.tr('delete')} position={Position.TOP}>
              <Button minimal small intent={Intent.DANGER} icon="trash" onClick={onDelete}></Button>
            </Tooltip>
          </div>
        </div>
      )}

      {!value && (
        <Fragment>
          <div className={localStyle.flexContainer}>
            <SmartInput singleLine className={style.textarea} value={url} onChange={handleUrlChange} />

            <Button intent={Intent.NONE} onClick={saveUrl}>
              {lang.tr('ok')}
            </Button>
          </div>
        </Fragment>
      )}
    </div>
  )
}

export default UrlUpload
