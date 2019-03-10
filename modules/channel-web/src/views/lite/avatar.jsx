import style from './style.scss'

const Avatar = ({ name, avatarUrl, height, width }) => {
  return (
    <div className={'bp-avatar ' + style.botAvatar}>
      {avatarUrl && <img height={height} width={width} src={avatarUrl} />}
      {!avatarUrl && (
        <svg width={width} height={width}>
          <text text-anchor="middle" x="50%" y="50%" dy="0.35em" fill="#ffffff" font-size="15">
            {name[0]}
          </text>
        </svg>
      )}
    </div>
  )
}

export default Avatar
