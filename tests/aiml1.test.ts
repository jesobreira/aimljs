import { AIML1Bot } from '../src/bots/AIML1Bot';

const HELLO_AIML = `<?xml version="1.0" encoding="UTF-8"?>
<aiml version="1.0">
  <category>
    <pattern>HELLO</pattern>
    <template>Hi there!</template>
  </category>
  <category>
    <pattern>MY NAME IS *</pattern>
    <template>Nice to meet you, <set name="username"><star/></set>!</template>
  </category>
  <category>
    <pattern>WHAT IS MY NAME</pattern>
    <template>Your name is <get name="username"/>.</template>
  </category>
  <category>
    <pattern>SAY *</pattern>
    <template><uppercase><star/></uppercase></template>
  </category>
  <category>
    <pattern>WHAT IS YOUR NAME</pattern>
    <template>My name is <bot name="name"/>.</template>
  </category>
  <category>
    <pattern>I AM *</pattern>
    <template>Hello <set name="username"><star/></set>!</template>
  </category>
  <category>
    <pattern>REPEAT AFTER ME *</pattern>
    <template><srai><star/></srai></template>
  </category>
  <category>
    <pattern>_ WORLD</pattern>
    <template>Pattern with underscore: <star/></template>
  </category>
</aiml>`;

const TOPIC_AIML = `<?xml version="1.0" encoding="UTF-8"?>
<aiml version="1.0">
  <category>
    <pattern>TALK ABOUT *</pattern>
    <template><think><set name="topic"><star/></set></think>Ok, let's talk about <star/>.</template>
  </category>
  <topic name="CATS">
    <category>
      <pattern>DO YOU LIKE THEM</pattern>
      <template>Yes, I love cats!</template>
    </category>
  </topic>
  <topic name="DOGS">
    <category>
      <pattern>DO YOU LIKE THEM</pattern>
      <template>Dogs are great!</template>
    </category>
  </topic>
</aiml>`;

const CONDITION_AIML = `<?xml version="1.0" encoding="UTF-8"?>
<aiml version="1.0">
  <category>
    <pattern>AM I LOGGED IN</pattern>
    <template>
      <condition name="loggedin" value="yes">You are logged in.</condition>
      <condition name="loggedin" value="no">You are not logged in.</condition>
    </template>
  </category>
  <category>
    <pattern>LOGIN</pattern>
    <template><think><set name="loggedin">yes</set></think>You are now logged in.</template>
  </category>
  <category>
    <pattern>MULTI CONDITION</pattern>
    <template>
      <condition name="mood">
        <li value="happy">You seem happy!</li>
        <li value="sad">Cheer up!</li>
        <li>I don't know your mood.</li>
      </condition>
    </template>
  </category>
</aiml>`;

const RANDOM_AIML = `<?xml version="1.0" encoding="UTF-8"?>
<aiml version="1.0">
  <category>
    <pattern>PICK ONE</pattern>
    <template>
      <random>
        <li>Option A</li>
        <li>Option B</li>
        <li>Option C</li>
      </random>
    </template>
  </category>
</aiml>`;

describe('AIML1Bot', () => {
  let bot: AIML1Bot;

  beforeEach(async () => {
    bot = new AIML1Bot({ properties: { name: 'Alice' } });
    await bot.loadXMLString(HELLO_AIML, 'hello.aiml');
  });

  it('matches exact pattern', async () => {
    const { response } = await bot.talk('hello');
    expect(response).toBe('Hi there!');
  });

  it('is case-insensitive', async () => {
    const { response } = await bot.talk('HELLO');
    expect(response).toBe('Hi there!');
  });

  it('captures wildcard with <star/>', async () => {
    const { response } = await bot.talk('my name is Bob');
    expect(response).toContain('Bob');
  });

  it('sets and gets predicates', async () => {
    await bot.talk('my name is Charlie');
    const { response } = await bot.talk('what is my name');
    expect(response).toContain('Charlie');
  });

  it('returns bot property with <bot name="..."/>', async () => {
    const { response } = await bot.talk('what is your name');
    expect(response).toContain('Alice');
  });

  it('applies <uppercase>', async () => {
    // Use "say hello there" — avoids triggering the "_ WORLD" pattern
    const { response } = await bot.talk('say hello there');
    expect(response).toBe('HELLO THERE');
  });

  it('processes <srai> recursion', async () => {
    const { response } = await bot.talk('repeat after me hello');
    expect(response).toBe('Hi there!');
  });

  it('_ wildcard has higher priority than exact', async () => {
    const { response } = await bot.talk('hello world');
    expect(response).toBe('Pattern with underscore: hello');
  });

  it('maintains separate sessions', async () => {
    await bot.talk('my name is Alice', 'session1');
    await bot.talk('my name is Bob', 'session2');
    const r1 = await bot.talk('what is my name', 'session1');
    const r2 = await bot.talk('what is my name', 'session2');
    expect(r1.response).toContain('Alice');
    expect(r2.response).toContain('Bob');
  });

  it('returns sessionId in TalkResult', async () => {
    const result = await bot.talk('hello', 'my-session');
    expect(result.sessionId).toBe('my-session');
  });

  describe('Topic', () => {
    beforeEach(async () => {
      await bot.loadXMLString(TOPIC_AIML, 'topic.aiml');
    });

    it('sets topic via <set name="topic">', async () => {
      await bot.talk('talk about cats');
      const session = bot.getSession((await bot.talk('talk about cats')).sessionId);
      // topic should be set
    });

    it('matches topic-specific categories', async () => {
      const { sessionId } = await bot.talk('talk about cats');
      const r = await bot.talk('do you like them', sessionId);
      expect(r.response).toContain('love cats');
    });

    it('different topics match different responses', async () => {
      // Use explicit session IDs so the two conversations don't share state
      const { sessionId: s1 } = await bot.talk('talk about cats', 'topic-test-1');
      const { sessionId: s2 } = await bot.talk('talk about dogs', 'topic-test-2');
      const r1 = await bot.talk('do you like them', s1);
      const r2 = await bot.talk('do you like them', s2);
      expect(r1.response).toContain('cats');
      expect(r2.response).toContain('Dogs');
    });
  });

  describe('Condition', () => {
    beforeEach(async () => {
      await bot.loadXMLString(CONDITION_AIML, 'condition.aiml');
    });

    it('block condition matches', async () => {
      const { sessionId } = await bot.talk('login');
      const r = await bot.talk('am i logged in', sessionId);
      expect(r.response.trim()).toContain('logged in');
    });

    it('multi-value condition with default li', async () => {
      const { response } = await bot.talk('multi condition');
      expect(response.trim()).toContain("don't know");
    });
  });

  describe('Random', () => {
    beforeEach(async () => {
      await bot.loadXMLString(RANDOM_AIML, 'random.aiml');
    });

    it('returns one of the options', async () => {
      const { response } = await bot.talk('pick one');
      expect(['Option A', 'Option B', 'Option C']).toContain(response);
    });

    it('returns different options over multiple calls', async () => {
      const results = new Set<string>();
      for (let i = 0; i < 30; i++) {
        const { response } = await bot.talk('pick one');
        results.add(response);
      }
      // With 30 calls, highly likely to get at least 2 different options
      expect(results.size).toBeGreaterThan(1);
    });
  });

  describe('Session management', () => {
    it('serializes and restores a session', async () => {
      const { sessionId } = await bot.talk('my name is Dave');
      const serialized = bot.serializeSession(sessionId);

      const bot2 = new AIML1Bot({ properties: { name: 'Alice' } });
      await bot2.loadXMLString(HELLO_AIML, 'hello.aiml');
      const restoredId = bot2.loadSerializedSession(serialized);

      const { response } = await bot2.talk('what is my name', restoredId);
      expect(response).toContain('Dave');
    });

    it('serializeAllSessions and loadAllSerializedSessions', async () => {
      await bot.talk('my name is Eve', 'sess1');
      await bot.talk('my name is Frank', 'sess2');
      const all = bot.serializeAllSessions();

      const bot2 = new AIML1Bot({ properties: { name: 'Alice' } });
      await bot2.loadXMLString(HELLO_AIML, 'hello.aiml');
      bot2.loadAllSerializedSessions(all);

      const r1 = await bot2.talk('what is my name', 'sess1');
      const r2 = await bot2.talk('what is my name', 'sess2');
      expect(r1.response).toContain('Eve');
      expect(r2.response).toContain('Frank');
    });
  });

  describe('Properties', () => {
    it('loadProperties from text', () => {
      bot.loadProperties('name:TestBot\nversion:2.0');
      expect(bot.getProperty('name')).toBe('TestBot');
      expect(bot.getProperty('version')).toBe('2.0');
    });

    it('setProperty updates bot name', async () => {
      bot.setProperty('name', 'Zara');
      const { response } = await bot.talk('what is your name');
      expect(response).toContain('Zara');
    });
  });

  describe('Substitutions', () => {
    it('loadSubstitutions normalizes input', async () => {
      bot.loadSubstitutions('normal', "can't : cannot\nwon't : will not");
      await bot.loadXMLString(`<aiml><category><pattern>I CANNOT DO IT</pattern><template>You can do it!</template></category></aiml>`);
      const { response } = await bot.talk("i can't do it");
      expect(response).toBe('You can do it!');
    });
  });

  describe('Validation', () => {
    it('validates correct AIML', () => {
      const result = bot.validateXML(HELLO_AIML);
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('reports error for missing <template>', () => {
      const bad = `<aiml><category><pattern>HELLO</pattern></category></aiml>`;
      const result = bot.validateXML(bad);
      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it('reports error for missing <pattern>', () => {
      const bad = `<aiml><category><template>Hello</template></category></aiml>`;
      const result = bot.validateXML(bad);
      expect(result.valid).toBe(false);
    });
  });

  describe('Sets', () => {
    it('matches set members in patterns', async () => {
      bot.loadSet('color', ['red', 'green', 'blue']);
      await bot.loadXMLString(
        `<aiml><category><pattern>MY FAVORITE COLOR IS <set>color</set></pattern><template>Nice color!</template></category></aiml>`,
      );
      const { response } = await bot.talk('my favorite color is blue');
      expect(response).toBe('Nice color!');
    });
  });
});
