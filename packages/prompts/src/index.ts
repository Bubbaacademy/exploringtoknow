import { registry } from './registry';
import { intelligenceV1 } from './prompts/intelligence';
import { briefV1, briefV2 } from './prompts/brief';
import { articleV1, articleV2 } from './prompts/article';
import { brandVoiceV1 } from './prompts/brandVoice';
import { regenerationV1 } from './prompts/regeneration';

// Register all prompts once at import time.
[intelligenceV1, briefV1, briefV2, articleV1, articleV2, brandVoiceV1, regenerationV1].forEach((p) =>
  registry.register(p),
);

export { registry };
export * from './types';
export type { IntelligenceVars } from './prompts/intelligence';
export type { BriefVars } from './prompts/brief';
export type { ArticleVars } from './prompts/article';
export type { BrandVoiceVars } from './prompts/brandVoice';
export type { RegenerationVars } from './prompts/regeneration';
