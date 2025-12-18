import type { Providers, ClientOptions } from '@aladin/agents';
import type { AgentModelParameters } from 'aladin-data-provider';
import type { OpenAIConfiguration } from './openai';

export type RunLLMConfig = {
  provider: Providers;
  streaming: boolean;
  streamUsage: boolean;
  usage?: boolean;
  configuration?: OpenAIConfiguration;
} & AgentModelParameters &
  ClientOptions;
