export const availableLanguages = [
  {
    code: 'en',
    name: 'English',
    flag:
      'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAAAY0lEQVRYw+2WOwoAIAxDc/9ZL+aFIoiDcy3ETwrBzT4TK4IklIIBDHAEAFAY1dgiqhWg1sbImgYQaT4A9uoFB+R3ICuCex3wFGQ6IHsJqasJsHOKFAfkAI7AETgCf8sN8DNABy9eueIDsN0kAAAAAElFTkSuQmCC'
  },
  {
    code: 'fr',
    name: 'French',
    flag:
      'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAAAxElEQVRYw2P4//8/w0BihlEHjDpgUDjgi4b5f1yYUkDA7FEHUOiA/fsheMAc4OAAwXR3QH39//8FBRDtIAxig8To6gCY5TBMUwfcv4/AIN+C4h3dASAxkByyWqo5AN3ChARMB6CLQRMn9aIA3UJCmKpR0N9PugNAeqjmgPfvsQc7LgxSC9JD9VxATEhAfU67bIic/9ExSI7m5cD69ZA8D0rlIN+CMIgNEgPJjay6YP78QeCA8+dHGySUO2C0VTzqgBHtAACjXMyehQpcsQAAAABJRU5ErkJggg=='
  },
  {
    code: 'ar',
    name: 'Arabic',
    flag:
      'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAADOklEQVRYw+1WaU9TURAtoqBREsVgjIl+UATZLKiIimvE4AdBRYgY4kIwKpoQRBAEEQglBqUEWqBQCihQCKssssieQNlEaLSIIHFN0C/+huPcWypuKMUFiXyY9L375r575syZ0ycAIJjJEMwBmAPwTwAQpNpjJmIWAEjZqA2pnfY3VThxLbWlsIFAYj2xpstJsdM+52vCaQKgjUvkO7AwfSuWKnbBKN0RBqkOMM3ag0UZ27AyxwXr8g7BpvAYlil2Y7F8O+U68Rx2v5zyjGnPfNlmLSh9ARgQeocib0gfFyJdUwrF03uwKjiKgPZbuNAmQpBKjJuPslD8vAGqd2p4N4Qie6gSLpXnEdqZhPaxfiQM5OIK5XGm9AJAFJpkOiOqV4ae9xrUv+mEfLAMrlX+8KoPhoRAsZBpihHWlQzlSC2COhKQ8qQIZ1tj4NcSjZpX7bjek4prXVJiRW8GhDCkX4/aQFS8aEXus2pioQQnGyPg3xaLJLUSp5oicaY5EsrhWvg0hiNRnYfAjtsciFd9CKpetkFMa34tMbyVWn3o0wISkVOJD64SnYnqfGg+jCKDWuFWE4C4PgViHmZwmjvGBghUHDIHy/mBvs1ROFh9ke8pGKnjuSZyZz0BkACNZFuwQXkEGYOluNGTRizchyMBEqtzcZmqrKQKi0YfoGy0EbF9cuyvPMcPY89EfZm8HYyN7KGKaTBA1a/KOUCViZA3XMMPY2IKUSXSdStnxb36EsQkMsfiE7AvOk7ijOetEBEIT9IJa8Npahnbt4BrQKhfC+albeJjZEojxcKQ7hkz7NqYRlOQZMHv+Trlr77ryqtkI6vzBptCTz6e36t+ikY0bjzcaIRfGtG4WD9VxoxHZ0K6ZxKbSQ+fJVb8mS9wWllFLKS6sP02kq2+YulXAdCLVmTv40KzJdu1LvDgjmhJE2KhPIz1+e4wz3fjtmxO1zvLfWGWtZdb94/+B6YOgKpaQwILpgmI7k1HVI8MkTSWzOUiulMQ3i0lt5NwRwyj6Wh624261yrE998hoVr+phYwSpnq2QtZJE8SlGNGbK0lNhgzP2vDnxEh04FOK7P/g+RvAZj7Kp4D8F8D+Ah8UqS8bnJ8jwAAAABJRU5ErkJggg=='
  }
]

export const availableModels = [
  {
    location: 'https://s3.amazonaws.com/botpress-binaries/botpress-v11_8_0-win-x64.zip',
    name: 'English - Development',
    size: 79463321,
    language: 'en',
    dimensions: 25,
    trainedOn: '2019-04-18T16:16:27.565Z',
    trainedBy: 'Botpress, Inc.'
  },
  {
    location: 'https://s3.amazonaws.com/botpress-binaries/botpress-v11_8_0-win-x64.zip',
    name: 'English - Production',
    size: 79463321,
    language: 'en',
    dimensions: 50,
    trainedOn: '2019-04-18T16:16:27.565Z',
    trainedBy: 'Botpress, Inc.'
  },
  {
    location: 'https://s3.amazonaws.com/botpress-binaries/botpress-v11_8_0-win-x64.zip',
    name: 'French - Development',
    size: 79463321,
    language: 'fr',
    dimensions: 50,
    trainedOn: '2019-04-18T16:16:27.565Z',
    trainedBy: 'Botpress, Inc.'
  },
  {
    location: 'hhttps://dl.fbaipublicfiles.com/fasttext/vectors-crawl/cc.en.300.bin.gz',
    name: 'French - Production',
    size: 4257946321,
    language: 'fr',
    dimensions: 100,
    trainedOn: '2019-04-18T16:16:27.565Z',
    trainedBy: 'Botpress, Inc.'
  }
]
