import * as $ from 'jquery'

function update() {
  jQuery.getJSON('https://s3.amazonaws.com/botpress-docs/versions.json', function(data) {
    $('#dropdownVersion + .dropdown-menu').empty()
    const current = $('.navbar-versions-label').text()
    data.sort().reverse().forEach(version => {
      const activeCls = current === version ? ' active' : ''
      $('#dropdownVersion + .dropdown-menu').append(`<a href="/docs/${version}" class="dropdown-item ${activeCls}">${version}</a>`)
    })
  })
}

update()
setTimeout(() => update(), 1000)
