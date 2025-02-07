
// This file is generated. Do not edit it manually.
// See 'scripts/update-models.ts'

/* eslint-disable */
/* tslint:disable */

export namespace llm {
    export namespace listLanguageModels {
      export type Input = { };;
      export type Output = { models: Array<{ id: string; name: string; description: string; tags: Array<'recommended' | 'deprecated' | 'general-purpose' | 'low-cost' | 'vision' | 'coding' | 'agents' | 'function-calling' | 'roleplay' | 'storytelling' | 'reasoning'>; input: { maxTokens: number; 
/** Cost per 1 million tokens, in U.S. dollars */
costPer1MTokens: number
 }; output: { maxTokens: number; 
/** Cost per 1 million tokens, in U.S. dollars */
costPer1MTokens: number
 } } & { id: string }> };;
    }
}