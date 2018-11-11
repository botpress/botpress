/**
 * Copyright (c) 2017-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

const React = require('react')

class Footer extends React.Component {
  docUrl(doc, language) {
    const baseUrl = this.props.config.baseUrl
    return `${baseUrl}docs/${language ? `${language}/` : ''}${doc}`
  }

  pageUrl(doc, language) {
    const baseUrl = this.props.config.baseUrl
    return baseUrl + (language ? `${language}/` : '') + doc
  }

  render() {
    return (
      <footer className="nav-footer" id="footer">
        <section className="sitemap">
          <div>
            <h5>Docs</h5>
            <a href={this.docUrl('introduction')}>Getting Started</a>
            <a href="https://botpress.io/docs/latest/reference/">API Reference</a>
          </div>
          <div>
            <h5>Community</h5>
            <a href="https://help.botpress.io/" target="_blank" rel="noreferrer noopener">
              help.botpress.io
            </a>
            <a href="https://stackoverflow.com/search?q=botpress" target="_blank" rel="noreferrer noopener">
              Stack Overflow
            </a>
          </div>
          <div>
            <h5>More</h5>
            <a href="https://github.com/botpress">GitHub</a>
            <a
              className="github-button"
              href={this.props.config.repoUrl}
              data-icon="octicon-star"
              data-count-href="/botpress/botpress/stargazers"
              data-show-count="true"
              data-count-aria-label="# stargazers on GitHub"
              aria-label="Star this project on GitHub"
            >
              Star
            </a>
            <a href="https://twitter.com/getbotpress">Twitter</a>
          </div>
        </section>

        <a href="botpress.io" target="_blank" rel="noreferrer noopener" className="fbOpenSource">
          <img src={`${this.props.config.baseUrl}img/botpress.svg`} alt="Botpress, Inc." width="170" height="45" />
        </a>
        <section className="copyright">{this.props.config.copyright}</section>
      </footer>
    )
  }
}

module.exports = Footer
