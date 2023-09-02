import semver from 'semver'

const semverReleases: Record<semver.ReleaseType, number> = {
  prerelease: 0,
  prepatch: 1,
  patch: 2,
  preminor: 3,
  minor: 4,
  premajor: 5,
  major: 6,
}

export namespace releases {
  export const eq = (a: semver.ReleaseType, b: semver.ReleaseType) => semverReleases[a] === semverReleases[b]
  export const gt = (a: semver.ReleaseType, b: semver.ReleaseType) => semverReleases[a] > semverReleases[b]
  export const gte = (a: semver.ReleaseType, b: semver.ReleaseType) => semverReleases[a] >= semverReleases[b]
  export const lt = (a: semver.ReleaseType, b: semver.ReleaseType) => semverReleases[a] < semverReleases[b]
  export const lte = (a: semver.ReleaseType, b: semver.ReleaseType) => semverReleases[a] <= semverReleases[b]
}
