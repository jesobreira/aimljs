import { PatternMatcher, parsePattern, tokenize } from '../src/core/PatternMatcher';
import type { Category } from '../src/types';
import { parseXML } from '../src/utils/domParser';

function makeCategory(pattern: string, that = '*', topic = '*', version: '1.0' | '2.0' = '1.0'): Category {
  const doc = parseXML('<template>ok</template>') as unknown as Document;
  return {
    id: `cat-${Math.random()}`,
    pattern: parsePattern(pattern, version),
    that: parsePattern(that, version),
    topic: parsePattern(topic, version),
    template: doc.documentElement as unknown as Node,
    aimlVersion: version,
  };
}

describe('parsePattern', () => {
  it('parses exact words', () => {
    const p = parsePattern('HELLO WORLD');
    expect(p.tokens).toHaveLength(2);
    expect(p.tokens[0]).toEqual({ type: 'exact', word: 'HELLO' });
    expect(p.tokens[1]).toEqual({ type: 'exact', word: 'WORLD' });
  });

  it('parses wildcard *', () => {
    const p = parsePattern('HELLO *');
    expect(p.tokens[1]).toEqual({ type: 'wildcard', char: '*' });
  });

  it('parses wildcard _', () => {
    const p = parsePattern('_ WORLD');
    expect(p.tokens[0]).toEqual({ type: 'wildcard', char: '_' });
  });

  it('parses AIML 2.0 wildcards # and ^', () => {
    const p = parsePattern('# WORLD ^', '2.0');
    expect(p.tokens[0]).toEqual({ type: 'wildcard', char: '#' });
    expect(p.tokens[2]).toEqual({ type: 'wildcard', char: '^' });
  });

  it('does not parse # and ^ in AIML 1.0', () => {
    const p = parsePattern('# HELLO', '1.0');
    // # should be treated as an exact word in 1.0
    expect(p.tokens[0]).toEqual({ type: 'exact', word: '#' });
  });
});

describe('tokenize', () => {
  it('splits on whitespace', () => {
    expect(tokenize('hello world foo')).toEqual(['hello', 'world', 'foo']);
  });

  it('trims and collapses whitespace', () => {
    expect(tokenize('  hello   world  ')).toEqual(['hello', 'world']);
  });

  it('returns empty for empty input', () => {
    expect(tokenize('')).toEqual([]);
  });
});

describe('PatternMatcher', () => {
  let matcher: PatternMatcher;

  beforeEach(() => {
    matcher = new PatternMatcher();
  });

  it('matches an exact pattern', () => {
    matcher.addCategory(makeCategory('HELLO'));
    const result = matcher.match('hello', '*', '*');
    expect(result).not.toBeNull();
    expect(result?.stars).toEqual([]);
  });

  it('returns null for no match', () => {
    matcher.addCategory(makeCategory('HELLO'));
    const result = matcher.match('goodbye', '*', '*');
    expect(result).toBeNull();
  });

  it('matches with * wildcard (one or more words)', () => {
    matcher.addCategory(makeCategory('HELLO *'));
    const result = matcher.match('hello world', '*', '*');
    expect(result).not.toBeNull();
    expect(result?.stars[0]).toBe('world');
  });

  it('* does not match zero words', () => {
    matcher.addCategory(makeCategory('HELLO *'));
    const result = matcher.match('hello', '*', '*');
    expect(result).toBeNull();
  });

  it('captures multiple words in *', () => {
    matcher.addCategory(makeCategory('I LIKE *'));
    const result = matcher.match('i like cats and dogs', '*', '*');
    expect(result).not.toBeNull();
    expect(result?.stars[0]).toBe('cats and dogs');
  });

  it('matches with _ wildcard (higher priority than exact)', () => {
    matcher.addCategory(makeCategory('HELLO WORLD'));
    matcher.addCategory(makeCategory('_ WORLD'));
    const result = matcher.match('hello world', '*', '*');
    // _ has higher priority than exact in AIML 1.0, so "_ WORLD" wins
    expect(result).not.toBeNull();
    expect(result?.category.pattern.raw).toBe('_ WORLD');
    expect(result?.stars[0]).toBe('hello');
  });

  it('_ has higher priority than *', () => {
    matcher.addCategory(makeCategory('HELLO *'));
    matcher.addCategory(makeCategory('_ WORLD'));
    const result = matcher.match('hello world', '*', '*');
    expect(result?.stars[0]).toBe('hello'); // _ matched
  });

  it('matches AIML 2.0 # wildcard (zero or more)', () => {
    matcher.addCategory(makeCategory('# WORLD', '*', '*', '2.0'));
    const result = matcher.match('world', '*', '*');
    expect(result).not.toBeNull();
    expect(result?.stars[0]).toBe('');
  });

  it('matches AIML 2.0 ^ wildcard (zero or more, lower priority)', () => {
    matcher.addCategory(makeCategory('HELLO ^', '*', '*', '2.0'));
    const result = matcher.match('hello', '*', '*');
    expect(result).not.toBeNull();
    expect(result?.stars[0]).toBe('');
  });

  it('matches with that pattern', () => {
    matcher.addCategory(makeCategory('HELLO', 'HI THERE', '*'));
    const resultWrong = matcher.match('hello', 'goodbye', '*');
    expect(resultWrong).toBeNull();
    const resultRight = matcher.match('hello', 'hi there', '*');
    expect(resultRight).not.toBeNull();
  });

  it('matches with topic pattern', () => {
    matcher.addCategory(makeCategory('HELLO', '*', 'SCIENCE'));
    const resultWrong = matcher.match('hello', '*', 'music');
    expect(resultWrong).toBeNull();
    const resultRight = matcher.match('hello', '*', 'science');
    expect(resultRight).not.toBeNull();
  });

  it('captures thatStars', () => {
    matcher.addCategory(makeCategory('HELLO', 'I SAID *', '*'));
    const result = matcher.match('hello', 'i said goodbye', '*');
    expect(result).not.toBeNull();
    expect(result?.thatStars[0]).toBe('goodbye');
  });

  it('captures topicStars', () => {
    matcher.addCategory(makeCategory('HELLO', '*', 'TALK ABOUT *'));
    const result = matcher.match('hello', '*', 'talk about cats');
    expect(result).not.toBeNull();
    expect(result?.topicStars[0]).toBe('cats');
  });

  it('priority: exact beats *', () => {
    matcher.addCategory(makeCategory('HELLO WORLD'));
    matcher.addCategory(makeCategory('HELLO *'));
    const result = matcher.match('hello world', '*', '*');
    // Exact match should win
    expect(result?.stars).toEqual([]);
  });

  it('addCategories works', () => {
    matcher.addCategories([
      makeCategory('FOO'),
      makeCategory('BAR'),
    ]);
    expect(matcher.size).toBe(2);
  });

  it('clear removes all categories', () => {
    matcher.addCategory(makeCategory('HELLO'));
    matcher.clear();
    expect(matcher.size).toBe(0);
    expect(matcher.match('hello', '*', '*')).toBeNull();
  });

  it('set-based matching', () => {
    const set = new Set(['cat', 'dog', 'fish']);
    matcher.setSet('animal', set);
    matcher.addCategory(makeCategory('I HAVE A <SET NAME="ANIMAL">'));
    const result = matcher.match('i have a dog', '*', '*');
    expect(result).not.toBeNull();
    expect(result?.stars[0]).toBe('dog');
  });
});
