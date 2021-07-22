const core = require('@actions/core')
const github = require('@actions/github')

const titleRE = /^(build|chore|ci|docs|style|refactor|perf|test|feat|fix|revert)(\([a-z-_0-9]+\)?((?=:\s)|(?=!:\s)))?!?:\s.+/

async function run() {
  try {
    const pull_request = JSON.parse(process.env.pull_request)
    const title = pull_request.title

    if (!titleRE.test(title)) {
      core.setFailed(
        'Title should be a conventionnal commit. Please refer to specification: https://www.conventionalcommits.org/en/v1.0.0/'
      )
    }
    if (!pull_request.body.toString().trim()) {
      core.setFailed(
        'Please set a proper description to your Pull Request. Describe why, how and what. Those are mandatory for the review process.'
      )
    }
    if (!pull_request.requested_reviewers.length && !pull_request.requested_teams.length) {
      core.setFailed('Request at least one reviewer on your Pull Request')
    }

    if (title.includes('feat')) {
      const token = process.env.token
      const octokit = github.getOctokit(token)
      const options = {
        repo: 'botpress',
        owner: 'botpress',
        pull_number: pull_request.number,
        per_page: 300
      }

      const files = await octokit.rest.pulls.listFiles(options)

      const hasTests = files.data.some(f => f.filename.includes('.test.'))
      if (!hasTests) {
        core.setFailed(
          `New features require new tests, please write e2e tests.\nThis eases review process and makes sure we don't introduce regressions in the long run.`
        )
      }
    }
  } catch (error) {
    core.setFailed(error.message)
  }
}

run()
