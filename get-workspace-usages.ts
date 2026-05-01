import { billing } from '@botpress/client'

async function main() {
  // Initialize the billing client
  const client = new billing.Client({
    apiUrl: 'https://api.botpress.dev',
    workspaceId: process.env.WORKSPACE_ID || 'wkspace_01KQ3VAW147WX76QSHJZYMD2RG',
    token: process.env.BP_TOKEN || 'bp_pat_X0Q9rbHhmFDth03zvOeqbfgtWhVibDkvDUr8',
  })

  // Call getWorkspaceUsages with a period (any datetime within the desired billing month, ISO 8601)
  const result = await client.getWorkspaceUsages({
    period: new Date().toISOString(), // Current month will be inferred
  })

  console.log('Workspace Usages:', result)
  console.log('\nQuotas:')
  Object.entries(result.quotas).forEach(([key, value]) => {
    console.log(`  ${key}: ${value.usage ?? 0} / ${value.quota}`)
  })
}

main().catch(console.error)
