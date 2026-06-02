import { AIML2Bot, parseProperties, parseSubstitutions, parseSet, parseMap } from '../src/index.js';
import { readdir, readFile } from 'fs/promises';
import { join, basename, extname } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), 'rosie');

async function loadDir(sub: string) {
  const r: Array<{ name: string; content: string }> = [];
  try {
    for (const e of await readdir(join(ROOT, sub), { withFileTypes: true })) {
      if (!e.isFile()) continue;
      r.push({ name: basename(e.name, extname(e.name)), content: await readFile(join(ROOT, sub, e.name), 'utf-8') });
    }
  } catch { }
  return r;
}

async function main() {
  const bot = new AIML2Bot({ properties: { name: 'Rosie' } });
  for (const { content } of await loadDir('system')) bot.loadProperties(parseProperties(content));
  const subTypes: any = { normal: 'normal', person: 'person', person2: 'person2', gender: 'gender', denormal: 'denormal' };
  for (const { name, content } of await loadDir('substitutions')) { const t = subTypes[name.toLowerCase()]; if (t) bot.loadSubstitutions(t, parseSubstitutions(content)); }
  for (const { name, content } of await loadDir('sets')) bot.loadSet(name, parseSet(content));
  for (const { name, content } of await loadDir('maps')) bot.loadMap(name, parseMap(content));
  await bot.loadDirectory(join(ROOT, 'aiml'), false, ['.aiml']);

  const allMaps = (bot as any).maps as Map<string, Map<string,string>>;
  console.log('All map keys:', [...allMaps.keys()].slice(0,5));
  // Synthesise missing "number" set (same as runner)
  const number2name = allMaps.get('number2name');
  const name2number = allMaps.get('name2number');
  console.log('number2name size:', number2name?.size, 'name2number size:', name2number?.size);
  const numberSet = new Set<string>();
  if (number2name) for (const k of number2name.keys()) numberSet.add(k);
  if (name2number) for (const k of name2number.keys()) numberSet.add(k);
  if (numberSet.size) bot.loadSet('number', numberSet);
  console.log('number set size:', numberSet.size, '— has "2":', numberSet.has('2'));

  const matcher = (bot as any).matcher;
  const SESSION = 'debug';

  // Reproduce the breaking conversation
  const tests = [
    'my name is john',
    'how do you know?',
  ];
  for (const t of tests) await bot.talk(t, SESSION);

  const sess = bot.getOrCreateSession(SESSION);
  const bThat = sess.getThat() || '*';
  const bTopic = sess.getTopic();
  console.log(`\nDEBUG: that="${bThat}"  topic="${bTopic}"`);

  // Check if TELL ME * JOKE exists in matcher
  const cats = (matcher as any).categories as any[];
  const jokeCats = cats.filter((c: any) => c.pattern.raw.toUpperCase().includes('TELL ME') && c.pattern.raw.toUpperCase().includes('JOKE'));
  console.log(`\nTELL+JOKE categories (${jokeCats.length}):`);
  for (const c of jokeCats.slice(0, 5)) {
    console.log(`  pattern="${c.pattern.raw}"  that="${c.that.raw}"  topic="${c.topic.raw}"  file=${c.file?.split('/').pop()}`);
  }

  // Direct match test
  const r = matcher.match('tell me a joke', bThat, bTopic);
  console.log('\nmatcher.match("tell me a joke", ...):', r ? `FOUND: "${r.category.pattern.raw}"` : 'null');

  // Also with * for both
  const r2 = matcher.match('tell me a joke', '*', '*');
  console.log('matcher.match("tell me a joke", *, *):', r2 ? `FOUND: "${r2.category.pattern.raw}"` : 'null');

  for (const input of tests) {
    const session = bot.getOrCreateSession(SESSION);
    const that = session.getThat() || '*';
    const topic = session.getTopic();
    const r = matcher.match(input, that, topic);
    const { response } = await bot.talk(input, SESSION);
    console.log(`\nINPUT:    "${input}"`);
    console.log(`THAT:     "${that.slice(0, 60)}"`);
    console.log(`TOPIC:    "${topic}"`);
    if (r) {
      console.log(`PATTERN:  "${r.category.pattern.raw}"`);
      console.log(`PAT_THAT: "${r.category.that.raw}"`);
      console.log(`FILE:     ${r.category.file?.split('/').pop()}`);
      console.log(`STARS:    ${JSON.stringify(r.stars)}`);
    } else {
      console.log('MATCH:    none');
    }
    console.log(`RESPONSE: "${response}"`);
  }
}

main().catch(console.error);
