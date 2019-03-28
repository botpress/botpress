const Avatar = ({ name, avatarUrl, height, width }) => {
  return (
    <div className={'bpw-bot-avatar'}>
      {avatarUrl && <img height={height} width={width} src={avatarUrl} />}
      {!avatarUrl && (
        <svg width={width} height={width}>
          <text textAnchor="middle" x="50%" y="50%" dy="0.35em" fill="#ffffff" fontSize="15">
            {name[0]}
          </text>
        </svg>
      )}
    </div>
  )
}

export default Avatar
