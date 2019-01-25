import React from 'react'
import crypto from 'crypto'

const SMALL_AVATAR = 25
const MEDIUM_AVATAR = 64
const LARGE_AVATAR = 200

const GravatarImage = ({ email, size, className }) => {
  const hash = crypto
    .createHash('md5')
    .update(email)
    .digest('hex')

  let imgSize
  if (size === 'lg') {
    imgSize = LARGE_AVATAR
  } else if (size === 'sm') {
    imgSize = SMALL_AVATAR
  } else {
    imgSize = MEDIUM_AVATAR
  }

  return <img src={`https://www.gravatar.com/avatar/${hash}?size=${imgSize}`} alt="" {...{ className }} />
}

export default GravatarImage
