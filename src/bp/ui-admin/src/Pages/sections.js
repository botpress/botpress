export default activePage => {
  return [
    { title: 'Teams', active: activePage === 'teams', link: '/teams' },
    { title: 'Users', active: activePage === 'users', link: '/users' },
    { title: 'Profile', active: activePage === 'profile', link: '/me' }
  ]
}
