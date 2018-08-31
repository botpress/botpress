export const getMenu = ({ teamId, currentPage, userHasPermission }) => {
  const pages = [
    { title: 'Bots', link: 'bots', show: userHasPermission('admin.team.bots', 'read') },
    { title: 'Members', link: 'members', show: userHasPermission('admin.team.members', 'read') },
    { title: 'Roles', link: 'roles', show: userHasPermission('admin.team.roles', 'read') },
    { title: 'Settings', link: 'settings', disabled: true }
  ]

  const url = link => `/teams/${teamId}/${link}`

  return pages.filter(page => page.show !== false).map(page => ({
    ...page,
    link: url(page.link),
    active: page.link === currentPage
  }))
}
