const { SitemapStream, streamToPromise } = require('sitemap')
const { Readable } = require('stream')
const fs = require('fs')
const siteConfig = require(`${process.cwd()}/siteConfig.js`)
const sidebar = require(`${process.cwd()}/sidebars.json`)

const links = [{ url: '/docs'}]

sidebar.docs['Channels'].map((value) => links.push({ url: `/docs/${value}`}))
sidebar.docs['Advanced Guides'].map((value) =>
  links.push({ url: `/docs/${value}`})
)
sidebar.docs['Pro Edition'].map((value) => links.push({ url: `/docs/${value}`}))
sidebar.docs['Improving Your Chatbot'].map((value) =>
  links.push({ url: `/docs/${value}`})
)
sidebar.docs['Managing Bots & Users'].map((value) =>
  links.push({ url: `/docs/${value}`})
)
sidebar.docs['Deployment And Infrastructure'].map((value) =>
  links.push({ url: `/docs/${value}`})
)
sidebar.docs['Natural Language Understanding'].map((value) =>
  links.push({ url: `/docs/${value}`})
)
sidebar.docs['Building A Chatbot'].map((value) =>
  links.push({ url: `/docs/${value}`})
)
sidebar.docs['Getting Started'].map((value) =>
  links.push({ url: `/docs/${value}`})
)
sidebar.docs['Release Notes'].map((value) => links.push({ url: `/docs/${value}`}))

// // Create a stream to write to
const stream = new SitemapStream({ hostname: siteConfig.url })

// // Return a promise that resolves with your XML string
return streamToPromise(Readable.from(links).pipe(stream)).then((data) => {
  let xml = data.toString()

  fs.writeFile(`${process.cwd()}/build/botpress-docs/sitemap.xml`, xml, function (err) {
    if (err) {
      console.log(err)
    } else {
      console.log('sitemap.xml was saved....')
    }
  })
})
