import style from './style.scss'

const Avatar = ({ name, avatarUrl, height, width }) => {
  return (
    <div className={'bp-avatar ' + style.botAvatar}>
      <img height={height} width={width} src={avatarUrl || `https://via.placeholder.com/64x64?text=${name[0]}`} />
    </div>
  )
}

export default Avatar
