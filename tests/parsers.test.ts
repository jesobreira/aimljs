import {
  parseProperties,
  parsePropertiesText,
  parsePropertiesJSON,
  parseSubstitutions,
  parseSubstitutionsText,
  parseSet,
  parseSetText,
  parseMap,
  parseMapText,
} from '../src/parsers/DataParser';
import { parseAIML, validateAIML } from '../src/parsers/AIMLParser';

describe('PropertiesParser', () => {
  it('parses colon-separated properties', () => {
    const result = parsePropertiesText('name:Alice\nage:30');
    expect(result.name).toBe('Alice');
    expect(result.age).toBe('30');
  });

  it('parses equals-separated properties', () => {
    const result = parsePropertiesText('name=Bob\nversion=2.0');
    expect(result.name).toBe('Bob');
    expect(result.version).toBe('2.0');
  });

  it('skips comment lines starting with #', () => {
    const result = parsePropertiesText('# comment\nname:Alice');
    expect(result['# comment']).toBeUndefined();
    expect(result.name).toBe('Alice');
  });

  it('skips blank lines', () => {
    const result = parsePropertiesText('\nname:Alice\n\nage:30\n');
    expect(Object.keys(result)).toHaveLength(2);
  });

  it('parses JSON properties', () => {
    const result = parsePropertiesJSON('{"name":"Alice","version":"1.0"}');
    expect(result.name).toBe('Alice');
    expect(result.version).toBe('1.0');
  });

  it('auto-detects JSON format', () => {
    const result = parseProperties('{"name":"Auto"}');
    expect(result.name).toBe('Auto');
  });

  it('auto-detects text format', () => {
    const result = parseProperties('name:Text');
    expect(result.name).toBe('Text');
  });

  it('handles object input directly', () => {
    const result = parseProperties({ Name: 'Direct', version: '3' });
    expect(result.name).toBe('Direct');
    expect(result.version).toBe('3');
  });
});

describe('SubstitutionsParser', () => {
  it('parses text substitutions', () => {
    const result = parseSubstitutionsText("can't : cannot\nwon't : will not");
    expect(result).toHaveLength(2);
    expect(result[0].replace).toBe('cannot');
    expect(result[1].replace).toBe('will not');
  });

  it('applies text substitutions correctly', () => {
    const pairs = parseSubstitutionsText("hello : hi");
    const text = 'hello world';
    let result = text;
    for (const { find, replace } of pairs) {
      result = result.replace(find, replace);
    }
    expect(result).toContain('hi');
  });

  it('parses JSON array substitutions', () => {
    const result = parseSubstitutions('[{"find":"hello","replace":"hi"},{"find":"world","replace":"earth"}]');
    expect(result).toHaveLength(2);
  });

  it('parses JSON object substitutions', () => {
    const result = parseSubstitutions('{"hello":"hi","world":"earth"}');
    expect(result).toHaveLength(2);
  });

  it('auto-detects text format', () => {
    const result = parseSubstitutions('hello : hi');
    expect(result).toHaveLength(1);
  });
});

describe('SetParser', () => {
  it('parses text set', () => {
    const set = parseSetText('cat\ndog\nfish');
    expect(set.has('cat')).toBe(true);
    expect(set.has('dog')).toBe(true);
    expect(set.has('fish')).toBe(true);
  });

  it('items are lowercase', () => {
    const set = parseSetText('Cat\nDOG');
    expect(set.has('cat')).toBe(true);
    expect(set.has('dog')).toBe(true);
  });

  it('skips comment lines', () => {
    const set = parseSetText('# comment\ncat');
    expect(set.has('# comment')).toBe(false);
    expect(set.has('cat')).toBe(true);
  });

  it('parses JSON array', () => {
    const set = parseSet('["cat","dog","fish"]');
    expect(set.has('cat')).toBe(true);
    expect(set.size).toBe(3);
  });

  it('parses string array', () => {
    const set = parseSet(['Cat', 'Dog']);
    expect(set.has('cat')).toBe(true);
    expect(set.has('dog')).toBe(true);
  });

  it('parses existing Set', () => {
    const set = parseSet(new Set(['Apple', 'Banana']));
    expect(set.has('apple')).toBe(true);
    expect(set.has('banana')).toBe(true);
  });
});

describe('MapParser', () => {
  it('parses text map', () => {
    const map = parseMapText('france : Paris\ngermany : Berlin');
    expect(map.get('france')).toBe('Paris');
    expect(map.get('germany')).toBe('Berlin');
  });

  it('keys are lowercase', () => {
    const map = parseMapText('France : Paris');
    expect(map.get('france')).toBe('Paris');
  });

  it('parses JSON map', () => {
    const map = parseMap('{"france":"Paris","germany":"Berlin"}');
    expect(map.get('france')).toBe('Paris');
  });

  it('parses object input', () => {
    const map = parseMap({ France: 'Paris', Germany: 'Berlin' });
    expect(map.get('france')).toBe('Paris');
  });

  it('parses Map input', () => {
    const map = parseMap(new Map([['France', 'Paris']]));
    expect(map.get('france')).toBe('Paris');
  });
});

describe('AIMLParser', () => {
  it('parses a basic AIML 1.0 file', () => {
    const result = parseAIML(`<aiml version="1.0">
      <category>
        <pattern>HELLO</pattern>
        <template>Hi!</template>
      </category>
    </aiml>`);
    expect(result.errors).toHaveLength(0);
    expect(result.categories).toHaveLength(1);
    expect(result.version).toBe('1.0');
    expect(result.categories[0].pattern.raw).toBe('HELLO');
  });

  it('detects AIML 2.0 version', () => {
    const result = parseAIML(`<aiml version="2.0"><category><pattern>HI</pattern><template>Hello!</template></category></aiml>`);
    expect(result.version).toBe('2.0');
  });

  it('parses topic wrapper', () => {
    const result = parseAIML(`<aiml version="1.0">
      <topic name="SCIENCE">
        <category>
          <pattern>TELL ME MORE</pattern>
          <template>Science is great!</template>
        </category>
      </topic>
    </aiml>`);
    expect(result.categories).toHaveLength(1);
    expect(result.categories[0].topic.raw).toBe('SCIENCE');
  });

  it('parses <that> context', () => {
    const result = parseAIML(`<aiml version="1.0">
      <category>
        <pattern>YES</pattern>
        <that>DO YOU LIKE CATS</that>
        <template>Great!</template>
      </category>
    </aiml>`);
    expect(result.categories[0].that.raw).toBe('DO YOU LIKE CATS');
  });

  it('reports error for missing root element', () => {
    const result = parseAIML(`<notaiml></notaiml>`);
    expect(result.errors.length).toBeGreaterThan(0);
  });

  it('reports error for category without pattern', () => {
    const result = parseAIML(`<aiml><category><template>Hi</template></category></aiml>`);
    expect(result.errors.length).toBeGreaterThan(0);
  });

  it('reports error for category without template', () => {
    const result = parseAIML(`<aiml><category><pattern>HELLO</pattern></category></aiml>`);
    expect(result.errors.length).toBeGreaterThan(0);
  });

  it('validateAIML returns valid for correct AIML', () => {
    const result = validateAIML(`<aiml><category><pattern>HI</pattern><template>Hello</template></category></aiml>`);
    expect(result.valid).toBe(true);
  });

  it('validateAIML returns invalid for bad AIML', () => {
    const result = validateAIML(`<aiml><category><pattern>HI</pattern></category></aiml>`);
    expect(result.valid).toBe(false);
  });

  it('parses multiple categories', () => {
    const result = parseAIML(`<aiml version="1.0">
      <category><pattern>A</pattern><template>1</template></category>
      <category><pattern>B</pattern><template>2</template></category>
      <category><pattern>C</pattern><template>3</template></category>
    </aiml>`);
    expect(result.categories).toHaveLength(3);
  });
});
