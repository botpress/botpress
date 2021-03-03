import { validateNameVersion } from './utils'

describe('Validate name and version', () => {
  test('Standard naming', () => {
    const axios = { name: 'axios', version: '^0.21.1' }
    expect(validateNameVersion(axios)).toEqual(axios)

    const pkg = { name: 'pkg', version: '4.3.7' }
    expect(validateNameVersion(pkg)).toEqual(pkg)
  })

  test('More complex versioning', () => {
    const gulp = { name: 'gulp-typescript', version: '^6.0.0-alpha.1' }
    expect(validateNameVersion(gulp)).toEqual(gulp)
  })

  test('Library on a github repository', () => {
    const pkg = {
      name: 'hard-source-webpack-plugin',
      version: 'git+https://github.com/botpress/hard-source-webpack-plugin.git'
    }
    expect(validateNameVersion(pkg)).toEqual(pkg)
  })
})
