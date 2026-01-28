import { ConnectClient, DescribeInstanceCommand, DescribeContactFlowCommand } from '@aws-sdk/client-connect'
import { ConnectParticipantClient } from '@aws-sdk/client-connectparticipant'

/**
 * Configuration interface for Amazon Connect clients
 */
export interface ClientConfig {
  awsRegion: string
  accessKeyId: string
  secretAccessKey: string
  instanceId: string
}

/**
 * Amazon Connect integration configuration
 */
export interface AmazonConnectConfiguration {
  awsRegion: string
  instanceId: string
  contactFlowId: string
  accessKeyId: string
  secretAccessKey: string
  webhookUrl?: string
  hitlContactFlowId?: string
  defaultQueue?: string
  botName?: string
  botAvatarUrl?: string
}

/**
 * Creates an Amazon Connect client for managing contacts and contact flows
 */
export function getConnectClient(config: ClientConfig): ConnectClient {
  return new ConnectClient({
    region: config.awsRegion,
    credentials: {
      accessKeyId: config.accessKeyId,
      secretAccessKey: config.secretAccessKey,
    },
  })
}

/**
 * Creates an Amazon Connect Participant client for sending/receiving messages
 */
export function getParticipantClient(config: ClientConfig): ConnectParticipantClient {
  return new ConnectParticipantClient({
    region: config.awsRegion,
    credentials: {
      accessKeyId: config.accessKeyId,
      secretAccessKey: config.secretAccessKey,
    },
  })
}

/**
 * Validates that the Amazon Connect instance exists and is accessible
 */
export async function validateInstance(
  client: ConnectClient,
  instanceId: string
): Promise<{ valid: boolean; error?: string }> {
  try {
    const command = new DescribeInstanceCommand({
      InstanceId: instanceId,
    })
    await client.send(command)
    return { valid: true }
  } catch (error) {
    if (error instanceof Error) {
      return {
        valid: false,
        error: `Failed to validate Amazon Connect instance: ${error.message}`,
      }
    }
    return {
      valid: false,
      error: 'Failed to validate Amazon Connect instance: Unknown error',
    }
  }
}

/**
 * Validates that a contact flow exists and is accessible
 */
export async function validateContactFlow(
  client: ConnectClient,
  instanceId: string,
  contactFlowId: string,
  flowName: string = 'Contact Flow'
): Promise<{ valid: boolean; error?: string }> {
  try {
    const command = new DescribeContactFlowCommand({
      InstanceId: instanceId,
      ContactFlowId: contactFlowId,
    })
    await client.send(command)
    return { valid: true }
  } catch (error) {
    if (error instanceof Error) {
      return {
        valid: false,
        error: `Failed to validate ${flowName}: ${error.message}`,
      }
    }
    return {
      valid: false,
      error: `Failed to validate ${flowName}: Unknown error`,
    }
  }
}

/**
 * Validates the complete Amazon Connect configuration
 */
export async function validateConfiguration(
  config: AmazonConnectConfiguration
): Promise<{ valid: boolean; errors: string[] }> {
  const errors: string[] = []

  try {
    // Create client
    const connectClient = getConnectClient({
      awsRegion: config.awsRegion,
      accessKeyId: config.accessKeyId,
      secretAccessKey: config.secretAccessKey,
      instanceId: config.instanceId,
    })

    // Validate instance
    const instanceResult = await validateInstance(connectClient, config.instanceId)
    if (!instanceResult.valid) {
      errors.push(instanceResult.error!)
    }

    // Validate main contact flow
    const contactFlowResult = await validateContactFlow(
      connectClient,
      config.instanceId,
      config.contactFlowId,
      'Bot Contact Flow'
    )
    if (!contactFlowResult.valid) {
      errors.push(contactFlowResult.error!)
    }

    // Validate HITL contact flow if provided
    if (config.hitlContactFlowId) {
      const hitlFlowResult = await validateContactFlow(
        connectClient,
        config.instanceId,
        config.hitlContactFlowId,
        'HITL Contact Flow'
      )
      if (!hitlFlowResult.valid) {
        errors.push(hitlFlowResult.error!)
      }
    }
  } catch (error) {
    if (error instanceof Error) {
      errors.push(`Configuration validation error: ${error.message}`)
    } else {
      errors.push('Configuration validation error: Unknown error')
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  }
}
