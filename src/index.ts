// ─── Main exports ──────────────────────────────────────────────────────────

export { AIMLBot } from './bots/AIMLBot';
export type { AIMLBotOptions } from './bots/AIMLBot';

export { AIML1Bot } from './bots/AIML1Bot';
export type { AIML1BotOptions } from './bots/AIML1Bot';

export { AIML2Bot } from './bots/AIML2Bot';
export type { AIML2BotOptions } from './bots/AIML2Bot';

export { Session } from './core/Session';
export { PatternMatcher, parsePattern, tokenize } from './core/PatternMatcher';
export { Normalizer, buildSubstitutionPair, createDefaultSubstitutions } from './core/Normalizer';

// ─── Parsers ───────────────────────────────────────────────────────────────

export { parseAIML, validateAIML } from './parsers/AIMLParser';
export type { ParsedAIML } from './parsers/AIMLParser';

export {
  parseProperties,
  parseSubstitutions,
  parseSet,
  parseMap,
  parsePropertiesText,
  parsePropertiesJSON,
  parseSubstitutionsText,
  parseSubstitutionsJSON,
  parseSetText,
  parseSetJSON,
  parseMapText,
  parseMapJSON,
} from './parsers/DataParser';

export { applySubstitutions } from './core/Normalizer';

// ─── Types ─────────────────────────────────────────────────────────────────

export type {
  Category,
  ParsedPattern,
  PatternToken,
  WildcardChar,
  SubstitutionPair,
  Substitutions,
  BotProperties,
  AIMLSet,
  AIMLMap,
  ConversationTurn,
  SessionData,
  TripleEntry,
  BotOptions,
  TalkResult,
  FileSource,
  ValidationError,
  ValidationResult,
  MatchResult,
  InterpreterContext,
} from './types';

// ─── Loader utilities ──────────────────────────────────────────────────────

export { loadFileSource, type FileContent } from './loaders/FileLoader';
