import { Button } from '@blueprintjs/core'
import { lang, toast } from 'botpress/shared'
import { sanitizeName } from 'common/utils'
import React, { FC, useRef, useState } from 'react'

interface Props {
  name: string
  version: string
  axios: any
}

const PackageLib: FC<Props> = props => {
  const downloadLink = useRef(null)
  const [content, setContent] = useState('')
  const [filename, setFilename] = useState('')
  const [loading, setLoading] = useState(false)

  const packageDeps = async () => {
    setLoading(true)

    try {
      const { name, version } = props

      const { data } = await props.axios.post('/mod/libraries/package', { name, version }, { responseType: 'blob' })

      setContent(window.URL.createObjectURL(new Blob([data])))
      setFilename(sanitizeName(`${name}-${version}.tgz`))

      downloadLink.current!.click()
    } catch (err) {
      toast.failure('module.libraries.bundleError')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <Button
        onClick={packageDeps}
        disabled={loading}
        text={lang.tr(loading ? 'pleaseWait' : 'module.libraries.bundleDeps')}
      />
      <a ref={downloadLink} href={content} download={filename} />
    </div>
  )
}

export default PackageLib
