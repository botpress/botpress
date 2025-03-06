import { getClient } from 'src/client';
import * as bpclient from "@botpress/client";
import type { RegisterFunction } from '../misc/types';

export const register: RegisterFunction = async ({ ctx, client, logger }) => {
  try {
    const zohoClient = getClient(
      ctx.configuration.accessToken,
      ctx.configuration.refreshToken,
      ctx.configuration.clientId,
      ctx.configuration.clientSecret,
      ctx.configuration.dataCenter,
      ctx,
      client
    );

    await client.setState({
      id: ctx.integrationId,
      type: "integration",
      name: 'credentials',
      payload: {
        accessToken: ctx.configuration.accessToken,
      }
    });

    const orgResult = await zohoClient.getOrganizationDetails();

    if (!orgResult.success || !orgResult.data || orgResult.data.length === 0) {
      throw new Error("Failed to retrieve organization details.");
    }

    logger.forBot().info("Successfully accessed Zoho CRM: Integration can proceed");
    logger.forBot().debug(`Organization Details: ${JSON.stringify(orgResult.data)}`);

  } catch (error) {
    logger.forBot().error("Failed to access Zoho CRM: Check configuration", error);
    
    throw new bpclient.RuntimeError(
      "Configuration Error! Unable to retrieve organization details."
    );
  }
};
