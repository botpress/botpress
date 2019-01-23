import React from 'react'
import crypto from 'crypto'

const GravatarImage = ({ email, size, className }) => {
  const hash = crypto
    .createHash('md5')
    .update(email)
    .digest('hex')

  let imgSize = 64
  if (size !== 'md') {
    imgSize = size === 'sm' ? 25 : 200
  }

  return <img src={`https://www.gravatar.com/avatar/${hash}?size=${imgSize}`} alt="" {...{ className }} />
}

export default GravatarImage
