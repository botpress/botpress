import { VisibilityProperty } from 'csstype'
import React, { FC, useEffect, useState } from 'react'

export const Avatar: FC<{ url: string; className: string }> = props => {
  const [visibility, setVisibility] = useState<VisibilityProperty>('visible')

  useEffect(() => {
    setVisibility(!props.url ? 'hidden' : 'visible')
  }, [props.url])

  const handleErrorImage = () => setVisibility('hidden')
  return <img src={props.url} style={{ visibility }} onError={handleErrorImage} className={props.className} />
}
