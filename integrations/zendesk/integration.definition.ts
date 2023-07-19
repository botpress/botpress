import { IntegrationDefinition } from '@botpress/sdk';
import { name } from './package.json';
import {
  actions,
  events,
  configuration,
  channels,
  states,
  user,
} from './src/definitions';

export default new IntegrationDefinition({
  name,
  version: '0.2.0',
  configuration,
  states,
  channels,
  user,
  actions,
  events,
});
