const core = require('@actions/core')

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
  } catch (error) {
    core.setFailed(error.message)
  }
}

run()
