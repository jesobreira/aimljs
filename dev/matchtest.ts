import { PatternMatcher, parsePattern, tokenize } from '../src/core/PatternMatcher.js';
import { parseXML } from '../src/utils/domParser.js';
import type { Category } from '../src/types.js';

function makeCategory(pattern: string, that = '*', topic = '*'): Category {
  const doc = parseXML('<template>ok</template>') as unknown as Document;
  return {
    id: 'test',
    pattern: parsePattern(pattern, '1.0'),
    that: parsePattern(that, '1.0'),
    topic: parsePattern(topic, '1.0'),
    template: doc.documentElement as unknown as Node,
    aimlVersion: '1.0',
  };
}

const matcher = new PatternMatcher();
matcher.addCategory(makeCategory('TELL ME * JOKE'));

const that = 'It is a ritual I do the same way every time';
const topic = 'know';

console.log('tokenize(that):', tokenize(that));
console.log('tokenize(topic):', tokenize(topic));

const result = matcher.match('tell me a joke', that, topic);
console.log('match result:', result ? `FOUND: pattern="${result.category.pattern.raw}" stars=${JSON.stringify(result.stars)}` : 'null');

// Also test with * topic
const result2 = matcher.match('tell me a joke', that, '*');
console.log('match with topic=*:', result2 ? 'FOUND' : 'null');

const result3 = matcher.match('tell me a joke', '*', 'know');
console.log('match with that=*:', result3 ? 'FOUND' : 'null');
