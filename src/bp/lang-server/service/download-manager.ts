import fse from 'fs-extra'
import ms from 'ms'

import ModelDownload from './model-download'

type ModelType = 'bpe' | 'embeddings'

export interface DownloadableModel {
  type: ModelType
  remoteUrl: string
  language: string
  size: number
  dim?: number
  domain?: string
}

const TEMP_DATA: Meta = {
  languages: {
    en: {
      code: 'en',
      name: 'English',
      flag:
        'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAAAY0lEQVRYw+2WOwoAIAxDc/9ZL+aFIoiDcy3ETwrBzT4TK4IklIIBDHAEAFAY1dgiqhWg1sbImgYQaT4A9uoFB+R3ICuCex3wFGQ6IHsJqasJsHOKFAfkAI7AETgCf8sN8DNABy9eueIDsN0kAAAAAElFTkSuQmCC'
    },
    fr: {
      code: 'fr',
      name: 'French',
      flag:
        'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAAAxElEQVRYw2P4//8/w0BihlEHjDpgUDjgi4b5f1yYUkDA7FEHUOiA/fsheMAc4OAAwXR3QH39//8FBRDtIAxig8To6gCY5TBMUwfcv4/AIN+C4h3dASAxkByyWqo5AN3ChARMB6CLQRMn9aIA3UJCmKpR0N9PugNAeqjmgPfvsQc7LgxSC9JD9VxATEhAfU67bIic/9ExSI7m5cD69ZA8D0rlIN+CMIgNEgPJjay6YP78QeCA8+dHGySUO2C0VTzqgBHtAACjXMyehQpcsQAAAABJRU5ErkJggg=='
    },
    ar: {
      code: 'ar',
      name: 'Arabic',
      flag:
        'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAADOklEQVRYw+1WaU9TURAtoqBREsVgjIl+UATZLKiIimvE4AdBRYgY4kIwKpoQRBAEEQglBqUEWqBQCihQCKssssieQNlEaLSIIHFN0C/+huPcWypuKMUFiXyY9L375r575syZ0ycAIJjJEMwBmAPwTwAQpNpjJmIWAEjZqA2pnfY3VThxLbWlsIFAYj2xpstJsdM+52vCaQKgjUvkO7AwfSuWKnbBKN0RBqkOMM3ag0UZ27AyxwXr8g7BpvAYlil2Y7F8O+U68Rx2v5zyjGnPfNlmLSh9ARgQeocib0gfFyJdUwrF03uwKjiKgPZbuNAmQpBKjJuPslD8vAGqd2p4N4Qie6gSLpXnEdqZhPaxfiQM5OIK5XGm9AJAFJpkOiOqV4ae9xrUv+mEfLAMrlX+8KoPhoRAsZBpihHWlQzlSC2COhKQ8qQIZ1tj4NcSjZpX7bjek4prXVJiRW8GhDCkX4/aQFS8aEXus2pioQQnGyPg3xaLJLUSp5oicaY5EsrhWvg0hiNRnYfAjtsciFd9CKpetkFMa34tMbyVWn3o0wISkVOJD64SnYnqfGg+jCKDWuFWE4C4PgViHmZwmjvGBghUHDIHy/mBvs1ROFh9ke8pGKnjuSZyZz0BkACNZFuwQXkEGYOluNGTRizchyMBEqtzcZmqrKQKi0YfoGy0EbF9cuyvPMcPY89EfZm8HYyN7KGKaTBA1a/KOUCViZA3XMMPY2IKUSXSdStnxb36EsQkMsfiE7AvOk7ijOetEBEIT9IJa8Npahnbt4BrQKhfC+albeJjZEojxcKQ7hkz7NqYRlOQZMHv+Trlr77ryqtkI6vzBptCTz6e36t+ikY0bjzcaIRfGtG4WD9VxoxHZ0K6ZxKbSQ+fJVb8mS9wWllFLKS6sP02kq2+YulXAdCLVmTv40KzJdu1LvDgjmhJE2KhPIz1+e4wz3fjtmxO1zvLfWGWtZdb94/+B6YOgKpaQwILpgmI7k1HVI8MkTSWzOUiulMQ3i0lt5NwRwyj6Wh624261yrE998hoVr+phYwSpnq2QtZJE8SlGNGbK0lNhgzP2vDnxEh04FOK7P/g+RvAZj7Kp4D8F8D+Ah8UqS8bnJ8jwAAAABJRU5ErkJggg=='
    }
  },
  bpe: {
    en: {
      type: 'bpe',
      remoteUrl: 'https://s3.amazonaws.com/botpress-binaries/botpress-v11_8_0-win-x64.zip',
      size: 79463321,
      language: 'en'
    },
    fr: {
      type: 'bpe',
      remoteUrl: 'https://nlp.h-its.org/bpemb/fr/fr.wiki.bpe.vs200000.model',
      size: 3831828,
      language: 'fr'
    },
    ar: {
      type: 'bpe',
      remoteUrl: 'https://s3.amazonaws.com/botpress-binaries/botpress-v11_8_0-win-x64.zip',
      size: 79463321,
      language: 'ar'
    }
  },
  embeddings: [
    {
      type: 'embeddings',
      remoteUrl: 'https://s3.amazonaws.com/botpress-binaries/botpress-v11_8_0-win-x64.zip',
      size: 79463321,
      language: 'en',
      dim: 50,
      domain: 'bp'
    },
    {
      type: 'embeddings',
      remoteUrl: 'https://s3.amazonaws.com/botpress-binaries/botpress-v11_8_0-win-x64.zip',
      size: 79463321,
      language: 'en',
      dim: 100,
      domain: 'bp'
    },
    {
      type: 'embeddings',
      remoteUrl: 'https://s3.amazonaws.com/botpress-binaries/botpress-v11_8_0-win-x64.zip',
      size: 79463321,
      language: 'fr',
      dim: 50,
      domain: 'bp'
    },
    {
      type: 'embeddings',
      remoteUrl: 'http://botpress-public.nyc3.digitaloceanspaces.com/embeddings/bp.fr.100.bin',
      size: 977353839,
      language: 'fr',
      dim: 100,
      domain: 'bp'
    }
  ]
}

interface Language {
  code: string
  name: string
  flag: string
}

interface Meta {
  languages: {
    [code: string]: Language
  }
  bpe: {
    [code: string]: DownloadableModel
  }
  embeddings: DownloadableModel[]
}

export default class DownloadManager {
  public inProgress: ModelDownload[] = []
  public available: DownloadableModel[] = []

  private _refreshTimer?: NodeJS.Timeout
  private meta: Meta | undefined

  constructor(
    public readonly dim: number,
    public readonly domain: string,
    public readonly destDir: string,
    public readonly metaUrl: string
  ) {}

  async init() {
    fse.ensureDirSync(this.destDir)
    if (this._refreshTimer) {
      clearInterval(this._refreshTimer)
    }
    this._refreshTimer = setInterval(() => this.refreshMeta(), ms('10m'))
    await this.refreshMeta()
  }

  async refreshMeta() {
    // TODO fetch this from remote instead
    this.meta = { ...TEMP_DATA } // This will be fetched from remote instead
    // this.availableLanguages = Object.keys(data.languages || {}).map(k => ({ ...data.languages[k], code: k }))
    // try {
    //   const { data } = await axios.get(this.metaUrl)
    //   if (data && isArray(data)) {
    //     this.available = data
    //   }
    // } catch (err) {
    //   debug('Error fecthing models', { url: this.metaUrl, message: err.message })
    // }
  }

  get downloadableLanguages() {
    if (!this.meta) {
      throw new Error('Meta not initialized yet')
    }

    return this.meta.embeddings
      .filter(mod => mod.dim === this.dim && mod.domain === this.domain)
      .map(mod => ({
        ...this.meta!.languages[mod.language],
        size: mod.size + this.meta!.bpe[mod.language].size
      }))
  }

  getEmbeddingModel(lang: string) {
    if (!this.meta) {
      throw new Error('Meta not initialized yet')
    }

    return this.meta.embeddings.find(mod => {
      return mod.dim === this.dim && mod.domain === this.domain && mod.language === lang
    })
  }

  cancelAndRemove(id: string) {
    const activeDownload = this.inProgress.find(x => x.id !== id)
    if (activeDownload && activeDownload.getStatus().status === 'downloading') {
      activeDownload.cancel()
    }

    this.remove(id)
  }

  private remove(id: string) {
    this.inProgress = this.inProgress.filter(x => x.id !== id)
  }

  async download(lang: string) {
    if (!this.downloadableLanguages.find(l => lang === l.code)) {
      throw new Error(`Could not find model of dimention "${this.dim}" in domain "${this.domain}" for lang "${lang}"`)
    }

    const embedding = this.getEmbeddingModel(lang)
    const bpe = this.meta!.bpe[lang]

    const dl = new ModelDownload([bpe, embedding!], this.destDir)
    await dl.start(this.remove.bind(this, dl.id))
    this.inProgress.push(dl)

    return dl.id
  }
}
