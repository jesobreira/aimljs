import { AIML1Bot } from '../src/bots/AIML1Bot';
import { AIML2Bot } from '../src/bots/AIML2Bot';

describe('Template Processing', () => {
  describe('String transforms', () => {
    let bot: AIML1Bot;

    beforeEach(async () => {
      bot = new AIML1Bot();
      await bot.loadXMLString(`<aiml version="1.0">
        <category><pattern>UPPER *</pattern><template><uppercase><star/></uppercase></template></category>
        <category><pattern>LOWER *</pattern><template><lowercase><star/></lowercase></template></category>
        <category><pattern>FORMAL *</pattern><template><formal><star/></formal></template></category>
        <category><pattern>SENTENCE *</pattern><template><sentence><star/></sentence></template></category>
        <category><pattern>PERSON *</pattern><template><person><star/></person></template></category>
        <category><pattern>PERSON2 *</pattern><template><person2><star/></person2></template></category>
        <category><pattern>GENDER *</pattern><template><gender><star/></gender></template></category>
      </aiml>`);
    });

    it('<uppercase>', async () => {
      const { response } = await bot.talk('upper hello world');
      expect(response).toBe('HELLO WORLD');
    });

    it('<lowercase>', async () => {
      const { response } = await bot.talk('lower HELLO WORLD');
      expect(response).toBe('hello world');
    });

    it('<formal>', async () => {
      const { response } = await bot.talk('formal hello world');
      expect(response).toBe('Hello World');
    });

    it('<sentence>', async () => {
      const { response } = await bot.talk('sentence HELLO WORLD');
      expect(response).toBe('Hello world');
    });

    it('<person> converts first to third person', async () => {
      const { response } = await bot.talk('person I am happy');
      expect(response.toLowerCase()).toContain('he or she is');
    });

    it('<person2> converts first to second person', async () => {
      const { response } = await bot.talk('person2 I am here');
      expect(response.toLowerCase()).toContain('you are');
    });

    it('<gender> swaps pronouns', async () => {
      // Single-pass simultaneous substitution: he→she, she→he in one pass
      // Input "he called her" → "she called him"
      const { response } = await bot.talk('gender he called her');
      expect(response.toLowerCase()).toContain('she');
      expect(response.toLowerCase()).toContain('him');
    });
  });

  describe('Predicate operations', () => {
    let bot: AIML1Bot;

    beforeEach(async () => {
      bot = new AIML1Bot();
      await bot.loadXMLString(`<aiml version="1.0">
        <category>
          <pattern>SET PRED *</pattern>
          <template><set name="testpred"><star/></set></template>
        </category>
        <category>
          <pattern>GET PRED</pattern>
          <template><get name="testpred"/></template>
        </category>
        <category>
          <pattern>THINK SET *</pattern>
          <template><think><set name="hidden"><star/></set></think>done</template>
        </category>
        <category>
          <pattern>GET HIDDEN</pattern>
          <template><get name="hidden"/></template>
        </category>
      </aiml>`);
    });

    it('<set> returns the value and stores it', async () => {
      const { sessionId, response } = await bot.talk('set pred hello');
      expect(response).toBe('hello');
      const r2 = await bot.talk('get pred', sessionId);
      expect(r2.response).toBe('hello');
    });

    it('<think><set> stores without outputting', async () => {
      const { sessionId, response } = await bot.talk('think set secret');
      expect(response).toBe('done');
      const r2 = await bot.talk('get hidden', sessionId);
      expect(r2.response).toBe('secret');
    });
  });

  describe('Input history', () => {
    let bot: AIML1Bot;

    beforeEach(async () => {
      bot = new AIML1Bot();
      await bot.loadXMLString(`<aiml version="1.0">
        <category><pattern>ECHO *</pattern><template><star/></template></category>
        <category><pattern>LAST INPUT</pattern><template><input index="1"/></template></category>
        <category><pattern>PREV INPUT</pattern><template><input index="2"/></template></category>
        <category><pattern>LAST THAT</pattern><template><that index="1,1"/></template></category>
      </aiml>`);
    });

    it('<input index="1"/> returns previous input', async () => {
      const { sessionId } = await bot.talk('echo remember this');
      const r = await bot.talk('last input', sessionId);
      expect(r.response).toBe('echo remember this');
    });

    it('<input index="2"/> returns input before last', async () => {
      const { sessionId } = await bot.talk('echo first');
      await bot.talk('echo second', sessionId);
      const r = await bot.talk('prev input', sessionId);
      expect(r.response).toBe('echo first');
    });

    it('<that index="1,1"/> returns last bot response', async () => {
      const { sessionId } = await bot.talk('echo hello robot');
      const r = await bot.talk('last that', sessionId);
      expect(r.response.toLowerCase()).toContain('hello robot');
    });
  });

  describe('Nested SRAI', () => {
    let bot: AIML1Bot;

    beforeEach(async () => {
      bot = new AIML1Bot();
      await bot.loadXMLString(`<aiml version="1.0">
        <category>
          <pattern>HELLO</pattern>
          <template>Hi there!</template>
        </category>
        <category>
          <pattern>SAY HELLO</pattern>
          <template><srai>HELLO</srai></template>
        </category>
        <category>
          <pattern>SAY HELLO TWICE</pattern>
          <template><srai>SAY HELLO</srai> <srai>HELLO</srai></template>
        </category>
        <category>
          <pattern>SR TEST</pattern>
          <template><sr/></template>
        </category>
      </aiml>`);
    });

    it('<srai> redirects to another category', async () => {
      const { response } = await bot.talk('say hello');
      expect(response).toBe('Hi there!');
    });

    it('nested <srai> works', async () => {
      const { response } = await bot.talk('say hello twice');
      expect(response).toBe('Hi there! Hi there!');
    });
  });

  describe('Condition forms', () => {
    let bot: AIML1Bot;

    beforeEach(async () => {
      bot = new AIML1Bot();
      await bot.loadXMLString(`<aiml version="1.0">
        <category>
          <pattern>SET STATUS *</pattern>
          <template><think><set name="status"><star/></set></think>ok</template>
        </category>
        <category>
          <pattern>CHECK STATUS</pattern>
          <template><condition name="status">
            <li value="active">Active!</li>
            <li value="inactive">Inactive!</li>
            <li>Unknown status.</li>
          </condition></template>
        </category>
        <category>
          <pattern>MULTI CHECK</pattern>
          <template><condition>
            <li name="status" value="active">Status is active.</li>
            <li name="mood" value="happy">Mood is happy.</li>
            <li>Neither.</li>
          </condition></template>
        </category>
      </aiml>`);
    });

    it('single-predicate multi-value condition', async () => {
      const { sessionId } = await bot.talk('set status active');
      const r = await bot.talk('check status', sessionId);
      expect(r.response.trim()).toBe('Active!');
    });

    it('condition default li', async () => {
      const { response } = await bot.talk('check status');
      expect(response.trim()).toBe('Unknown status.');
    });

    it('multi-predicate condition', async () => {
      const { sessionId } = await bot.talk('set status active');
      const r = await bot.talk('multi check', sessionId);
      expect(r.response.trim()).toBe('Status is active.');
    });
  });

  describe('Bot info tags', () => {
    let bot: AIML1Bot;

    beforeEach(async () => {
      bot = new AIML1Bot({ properties: { name: 'TestBot', version: '1.5' } });
      await bot.loadXMLString(`<aiml version="1.0">
        <category><pattern>NAME</pattern><template><bot name="name"/></template></category>
        <category><pattern>VERSION</pattern><template><version/></template></category>
        <category><pattern>SIZE</pattern><template><size/></template></category>
        <category><pattern>ID</pattern><template><id/></template></category>
        <category><pattern>DATE</pattern><template><date/></template></category>
      </aiml>`);
    });

    it('<bot name="name"/> returns bot name', async () => {
      const { response } = await bot.talk('name');
      expect(response).toBe('TestBot');
    });

    it('<version/> returns version', async () => {
      const { response } = await bot.talk('version');
      expect(response).toBe('1.5');
    });

    it('<size/> returns category count', async () => {
      const { response } = await bot.talk('size');
      expect(Number(response)).toBeGreaterThan(0);
    });

    it('<id/> returns session id', async () => {
      const { response, sessionId } = await bot.talk('id');
      expect(response).toBe(sessionId);
    });

    it('<date/> returns a date string', async () => {
      const { response } = await bot.talk('date');
      expect(response.length).toBeGreaterThan(5);
    });
  });

  describe('AIML 2.0 specific tags', () => {
    let bot: AIML2Bot;

    beforeEach(async () => {
      bot = new AIML2Bot();
      await bot.loadXMLString(`<aiml version="2.0">
        <category>
          <pattern>NORMALIZE *</pattern>
          <template><normalize><star/></normalize></template>
        </category>
        <category>
          <pattern>DENORMALIZE *</pattern>
          <template><denormalize><star/></denormalize></template>
        </category>
        <category>
          <pattern>EXPLODE *</pattern>
          <template><explode><star/></explode></template>
        </category>
        <category>
          <pattern>REQUEST HISTORY</pattern>
          <template><request index="1"/></template>
        </category>
        <category>
          <pattern>RESPONSE HISTORY</pattern>
          <template><response index="1"/></template>
        </category>
      </aiml>`);
    });

    it('<explode> separates each character with space', async () => {
      const { response } = await bot.talk('explode abc');
      expect(response).toBe('a b c');
    });

    it('<request> returns previous input', async () => {
      const { sessionId } = await bot.talk('explode hi');
      const r = await bot.talk('request history', sessionId);
      expect(r.response).toBe('explode hi');
    });

    it('<response> returns previous bot response', async () => {
      const { sessionId } = await bot.talk('explode hi');
      const r = await bot.talk('response history', sessionId);
      expect(r.response).toBe('h i');
    });
  });
});
