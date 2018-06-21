import * as $ from 'jquery'

const sortVersions = arr =>
  arr
    .map(a =>
      a
        .split('.')
        .map(n => (isNaN(n) ? n : +n + 100000))
        .join('.')
    )
    .sort()
    .map(a =>
      a
        .split('.')
        .map(n => (isNaN(n) ? n : +n - 100000))
        .join('.')
    )

function update() {
  jQuery.getJSON('https://s3.amazonaws.com/botpress-docs/versions.json', function(data) {
    const current = $('.navbar-versions-label').text()
    $('#dropdownVersion + .dropdown-menu').html(
      sortVersions(data)
        .reverse()
        .map(version => {
          const activeCls = current === version ? ' active' : ''
          return `<a href="/docs/${version}" class="dropdown-item ${activeCls}">${version}</a>`
        })
    )
  })
}

update()
setTimeout(() => update(), 1000)
