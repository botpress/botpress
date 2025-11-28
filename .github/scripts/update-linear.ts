import { LinearClient, Team, WorkflowState, IssueLabel } from '@linear/sdk'

const LINEAR_API_KEY = process.env.LINEAR_API_KEY
const SOURCE_STATE_NAME = 'Staging'
const TARGET_STATE_NAME = 'Production (Done)'
const TEAM_NAME = process.env.TEAM_NAME
const TARGET_LABEL = process.env.TARGET_LABEL

if (!LINEAR_API_KEY) {
  throw new Error('No LINEAR_API_KEY environment variable')
}

if (!TEAM_NAME) {
  throw new Error('No TEAM_NAME environment variable')
}

if (!TARGET_LABEL) {
  throw new Error('No TARGET_LABEL environment variable')
}

await updateLinearIssues()

async function getTeam(): Promise<Team> {
  const client = new LinearClient({ apiKey: LINEAR_API_KEY })
  const teams = await client.teams()
  const targetTeam = teams.nodes.find((t) => t.name === TEAM_NAME)

  if (!targetTeam) throw new Error(`Could not find team with name "${TEAM_NAME}"`)
  return targetTeam
}

async function getStates(targetTeam: Team): Promise<{ sourceState: WorkflowState; targetState: WorkflowState }> {
  const states = await targetTeam.states()
  const sourceState = states.nodes.find((s) => s.name === SOURCE_STATE_NAME)
  const targetState = states.nodes.find((s) => s.name === TARGET_STATE_NAME)

  if (!sourceState) throw new Error(`Could not find workflow state ${SOURCE_STATE_NAME}`)
  if (!targetState) throw new Error(`Could not find workflow state ${TARGET_STATE_NAME}`)

  console.log(`Found source state: ${sourceState.name} (${sourceState.id})`)
  console.log(`Found target state: ${targetState.name} (${targetState.id})`)

  return { sourceState, targetState }
}

async function getTargetLabels(targetTeam: Team): Promise<IssueLabel[]> {
  let labels = await targetTeam.labels()
  const labelsArray = [...labels.nodes]

  while (labels.pageInfo.hasNextPage) {
    labels = await labels.fetchNext()
    labelsArray.push(...labels.nodes)
  }

  const targetLabels = labelsArray.filter(
    (label) => label.name === TARGET_LABEL || label.name.startsWith(TARGET_LABEL + '/')
  )

  if (targetLabels.length === 0) {
    throw new Error(`Could not find any labels matching ${TARGET_LABEL}`)
  }

  console.log(`Found ${targetLabels.length} matching label(s):`)
  targetLabels.forEach((label) => {
    console.log(`  - ${label.name} (${label.id})`)
  })

  return targetLabels
}

async function updateLinearIssues() {
  const targetTeam = await getTeam()
  const { sourceState, targetState } = await getStates(targetTeam)
  const targetLabels = await getTargetLabels(targetTeam)

  const targetLabelIds = targetLabels.map((label) => label.id)

  const issues = await targetTeam.issues({
    filter: {
      labels: { some: { id: { in: targetLabelIds } } },
      state: { id: { eq: sourceState.id } },
    },
  })

  console.log(`Found ${issues.nodes.length} issue(s) in state "${SOURCE_STATE_NAME}"`)

  await Promise.all(
    issues.nodes.map(async (issue) => {
      console.log(`Updating issue ${issue.identifier} to ${TARGET_STATE_NAME}`)
      await issue.update({ stateId: targetState.id })
    })
  )
}
