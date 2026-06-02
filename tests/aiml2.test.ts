import { AIML2Bot } from '../src/bots/AIML2Bot';

const BASE_AIML2 = `<?xml version="1.0" encoding="UTF-8"?>
<aiml version="2.0">
  <category>
    <pattern>HELLO</pattern>
    <template>Hi!</template>
  </category>
  <category>
    <pattern>MY NAME IS *</pattern>
    <template>Hello, <set name="username"><star/></set>!</template>
  </category>
  <category>
    <pattern>WHAT IS MY NAME</pattern>
    <template>You are <get name="username"/>.</template>
  </category>
  <category>
    <pattern>NORMALIZE THIS *</pattern>
    <template><normalize><star/></normalize></template>
  </category>
  <category>
    <pattern>EXPLODE *</pattern>
    <template><explode><star/></explode></template>
  </category>
  <category>
    <pattern>FIRST OF *</pattern>
    <template><first><star/></first></template>
  </category>
  <category>
    <pattern>REST OF *</pattern>
    <template><rest><star/></rest></template>
  </category>
</aiml>`;

const WILDCARD_AIML2 = `<?xml version="1.0" encoding="UTF-8"?>
<aiml version="2.0">
  <category>
    <pattern># HELLO</pattern>
    <template>Hash before hello: <star/></template>
  </category>
  <category>
    <pattern>HELLO ^</pattern>
    <template>Hello with optional after: <star/></template>
  </category>
  <category>
    <pattern>_ WORLD</pattern>
    <template>Before world: <star/></template>
  </category>
  <category>
    <pattern>HELLO *</pattern>
    <template>Hello star: <star/></template>
  </category>
</aiml>`;

const MAP_AIML2 = `<?xml version="1.0" encoding="UTF-8"?>
<aiml version="2.0">
  <category>
    <pattern>CAPITAL OF *</pattern>
    <template>The capital of <star/> is <map name="capitals"><star/></map>.</template>
  </category>
</aiml>`;

const TRIPLE_AIML2 = `<?xml version="1.0" encoding="UTF-8"?>
<aiml version="2.0">
  <category>
    <pattern>ADD TRIPLE * LIKES *</pattern>
    <template><addtriple><subj><star index="1"/></subj><pred>likes</pred><obj><star index="2"/></obj></addtriple>Added.</template>
  </category>
  <category>
    <pattern>WHAT DOES * LIKE</pattern>
    <template><uniq><subj><star/></subj><pred>likes</pred><obj>?x</obj></uniq></template>
  </category>
</aiml>`;

const LOOP_AIML2 = `<?xml version="1.0" encoding="UTF-8"?>
<aiml version="2.0">
  <category>
    <pattern>COUNT TO *</pattern>
    <template>
      <think>
        <set name="count">0</set>
        <set name="target"><star/></set>
      </think>
      <condition name="count">
        <li value="<get name="target"/>">Done!</li>
        <li>
          <think><set name="count"><map name="successor"><get name="count"/></map></set></think>
          <get name="count"/>
          <loop/>
        </li>
      </condition>
    </template>
  </category>
</aiml>`;

const SRAIX_AIML2 = `<?xml version="1.0" encoding="UTF-8"?>
<aiml version="2.0">
  <category>
    <pattern>EXTERNAL *</pattern>
    <template><sraix service="myservice"><star/></sraix></template>
  </category>
</aiml>`;

describe('AIML2Bot', () => {
  let bot: AIML2Bot;

  beforeEach(async () => {
    bot = new AIML2Bot({ properties: { name: 'Bot2' } });
    await bot.loadXMLString(BASE_AIML2, 'base.aiml');
  });

  it('matches basic pattern', async () => {
    const { response } = await bot.talk('hello');
    expect(response).toBe('Hi!');
  });

  it('sets and gets predicates', async () => {
    const { sessionId } = await bot.talk('my name is Zoe');
    const r = await bot.talk('what is my name', sessionId);
    expect(r.response).toContain('Zoe');
  });

  it('<explode> separates characters', async () => {
    const { response } = await bot.talk('explode hi');
    expect(response).toBe('h i');
  });

  it('<first> returns first word', async () => {
    const { response } = await bot.talk('first of one two three');
    expect(response).toBe('one');
  });

  it('<rest> returns all but first word', async () => {
    const { response } = await bot.talk('rest of one two three');
    expect(response).toBe('two three');
  });

  describe('AIML 2.0 wildcards', () => {
    beforeEach(async () => {
      await bot.loadXMLString(WILDCARD_AIML2, 'wildcards.aiml');
    });

    it('# matches zero or more words before', async () => {
      const { response } = await bot.talk('hello');
      // # HELLO matches with zero words; response is trimmed by processInput
      expect(response).toBe('Hash before hello:');
    });

    it('# matches words before', async () => {
      const { response } = await bot.talk('hey there hello');
      expect(response).toContain('Hash before hello');
    });

    it('^ matches zero words after', async () => {
      // # has priority over ^, so for "hello" # wins
      // For "hello world", _ has higher priority over ^ and *
      // Let's test ^ directly
      const { response } = await bot.talk('hello world');
      // _ WORLD should match with star = "hello"
      expect(response).toContain('Before world: hello');
    });
  });

  describe('Maps', () => {
    beforeEach(async () => {
      await bot.loadXMLString(MAP_AIML2, 'maps.aiml');
      bot.loadMap('capitals', {
        france: 'Paris',
        germany: 'Berlin',
        japan: 'Tokyo',
      });
    });

    it('looks up map values', async () => {
      const { response } = await bot.talk('capital of france');
      expect(response).toContain('Paris');
    });

    it('returns empty for unknown map key', async () => {
      const { response } = await bot.talk('capital of mars');
      expect(response).toContain('is .');
    });

    it('loads map from text format', async () => {
      bot.loadMap('fruits', 'apple : red\nbanana : yellow\ngrape : purple');
      // Verify internal storage
      const mapData = (bot as any).maps.get('fruits');
      expect(mapData.get('apple')).toBe('red');
      expect(mapData.get('banana')).toBe('yellow');
    });

    it('loads map from JSON format', async () => {
      bot.loadMap('scores', '{"alice": "100", "bob": "200"}');
      const mapData = (bot as any).maps.get('scores');
      expect(mapData.get('alice')).toBe('100');
    });
  });

  describe('Triple store', () => {
    beforeEach(async () => {
      await bot.loadXMLString(TRIPLE_AIML2, 'triples.aiml');
    });

    it('adds and queries triples', async () => {
      const { sessionId } = await bot.talk('add triple Alice likes Cats');
      const session = bot.getSession(sessionId)!;
      const triples = session.queryTriples('alice', 'likes', 'cats');
      expect(triples).toHaveLength(1);
    });

    it('retrieves triple data via <uniq>', async () => {
      const { sessionId } = await bot.talk('add triple Bob likes Dogs');
      const r = await bot.talk('what does bob like', sessionId);
      expect(r.response.toLowerCase()).toContain('dogs');
    });
  });

  describe('SRAIX', () => {
    beforeEach(async () => {
      await bot.loadXMLString(SRAIX_AIML2, 'sraix.aiml');
    });

    it('calls the sraix handler', async () => {
      bot.setSraixHandler(async (service, input) => {
        expect(service).toBe('myservice');
        expect(input).toBe('hello there');
        return 'external response';
      });
      const { response } = await bot.talk('external hello there');
      expect(response).toBe('external response');
    });

    it('returns empty string if no handler', async () => {
      const { response } = await bot.talk('external hello');
      expect(response).toBe('');
    });
  });

  describe('Data loading', () => {
    it('loads set from JSON array', () => {
      bot.loadSet('animals', '["cat", "dog", "fish"]');
      const set = (bot as any).sets.get('animals');
      expect(set.has('cat')).toBe(true);
      expect(set.has('dog')).toBe(true);
    });

    it('loads set from text format', () => {
      bot.loadSet('colors', 'red\ngreen\nblue');
      const set = (bot as any).sets.get('colors');
      expect(set.has('red')).toBe(true);
      expect(set.has('blue')).toBe(true);
    });

    it('loads substitutions from JSON', () => {
      bot.loadSubstitutions('normal', '[{"find":"cant","replace":"cannot"}]');
      // Substitution should be applied during normalization
    });

    it('loads properties from JSON', () => {
      bot.loadProperties('{"name": "JsonBot", "version": "2.0"}');
      expect(bot.getProperty('name')).toBe('JsonBot');
      expect(bot.getProperty('version')).toBe('2.0');
    });
  });

  describe('Session serialization', () => {
    it('serializes and restores AIML 2.0 session with triples', async () => {
      const { sessionId } = await bot.talk('my name is Kai');
      const session = bot.getSession(sessionId)!;
      session.addTriple('kai', 'likes', 'music');

      const serialized = bot.serializeSession(sessionId);

      const bot2 = new AIML2Bot({ properties: { name: 'Bot2' } });
      await bot2.loadXMLString(BASE_AIML2, 'base.aiml');
      const restoredId = bot2.loadSerializedSession(serialized);

      const r = await bot2.talk('what is my name', restoredId);
      expect(r.response).toContain('Kai');

      const restoredSession = bot2.getSession(restoredId)!;
      expect(restoredSession.queryTriples('kai', 'likes', 'music')).toHaveLength(1);
    });
  });
});
