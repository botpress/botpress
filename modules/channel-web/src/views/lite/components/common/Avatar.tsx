import * as React from 'react'

const Avatar = ({ name, avatarUrl, height, width }: AvatarProps) => {
  return (
    <div className={'bpw-bot-avatar'}>
      {avatarUrl && <img height={height} width={width} src={avatarUrl} />}
      {!avatarUrl && (
        <svg width={width} height={width}>
          <text textAnchor={'middle'} x={'50%'} y={'50%'} dy={'0.35em'} fill={'#ffffff'} fontSize={15}>
            {name && name[0]}
          </text>
        </svg>
      )}
    </div>
  )
}

export default Avatar

export interface AvatarProps {
  name: string
  avatarUrl: string
  height: number
  width: number
}
