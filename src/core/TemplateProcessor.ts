import { getNodeName, getAttribute } from '../utils/domParser';
import type { InterpreterContext, AIMLMap } from '../types';
import type { Session } from './Session';
import type { Normalizer } from './Normalizer';
import type { PatternMatcher } from './PatternMatcher';
import { parsePattern } from './PatternMatcher';

export interface ProcessorDeps {
  normalizer: Normalizer;
  matcher: PatternMatcher;
  botProperties: Record<string, string>;
  maps: Map<string, AIMLMap>;
  maxRecursionDepth: number;
  maxLoopIterations: number;
  sraix?: (service: string, input: string, ctx: InterpreterContext) => Promise<string>;
  system?: (cmd: string) => Promise<string>;
  learnf?: (xml: string) => Promise<void>;
  onGossip?: (text: string) => void;
}

export class TemplateProcessor {
  constructor(private deps: ProcessorDeps) {}

  async process(templateNode: Node, ctx: InterpreterContext): Promise<string> {
    if (ctx.recursionDepth > this.deps.maxRecursionDepth) {
      return '[max recursion depth exceeded]';
    }
    return this.processChildren(templateNode, ctx);
  }

  private async processChildren(node: Node, ctx: InterpreterContext): Promise<string> {
    let result = '';
    for (let i = 0; i < node.childNodes.length; i++) {
      const child = node.childNodes.item(i);
      if (!child) continue;
      if (child.nodeType === 3 || child.nodeType === 4) {
        result += child.nodeValue ?? '';
      } else if (child.nodeType === 1) {
        result += await this.processElement(child as unknown as Element, ctx);
      }
    }
    return result;
  }

  private async processElement(el: Element, ctx: InterpreterContext): Promise<string> {
    const tag = getNodeName(el as unknown as Node).toLowerCase();

    switch (tag) {
      // ── Output control ────────────────────────────────────────────────────
      case 'think':
        await this.processChildren(el as unknown as Node, ctx);
        return '';

      case 'oob':
        // Out-of-band: pass through as raw XML for the caller to handle
        return `<oob>${await this.processChildren(el as unknown as Node, ctx)}</oob>`;

      // ── String transforms ─────────────────────────────────────────────────
      // Per the AIML spec, when a transform tag is self-closing (no children)
      // it implicitly operates on <star/> (the first wildcard capture).
      case 'uppercase':
        return this.deps.normalizer.uppercase(
          await this.transformContent(el, ctx),
        );
      case 'lowercase':
        return this.deps.normalizer.lowercase(
          await this.transformContent(el, ctx),
        );
      case 'formal':
        return this.deps.normalizer.formal(
          await this.transformContent(el, ctx),
        );
      case 'sentence':
        return this.deps.normalizer.sentence(
          await this.transformContent(el, ctx),
        );
      case 'normalize':
        return this.deps.normalizer.normalize(
          await this.transformContent(el, ctx),
        );
      case 'denormalize':
        return this.deps.normalizer.denormalize(
          await this.transformContent(el, ctx),
        );
      case 'person':
        return this.deps.normalizer.person(
          await this.transformContent(el, ctx),
        );
      case 'person2':
        return this.deps.normalizer.person2(
          await this.transformContent(el, ctx),
        );
      case 'gender':
        return this.deps.normalizer.gender(
          await this.transformContent(el, ctx),
        );
      case 'explode':
        return this.deps.normalizer.explode(
          await this.transformContent(el, ctx),
        );

      // ── Star / captures ───────────────────────────────────────────────────
      case 'star':
        return this.getStar(el, ctx);
      case 'thatstar':
        return this.getThatStar(el, ctx);
      case 'topicstar':
        return this.getTopicStar(el, ctx);

      // ── Predicates ─────────────────────────────────────────────────────────
      case 'get':
        return this.getGet(el, ctx);
      case 'set':
        return await this.processSet(el, ctx);

      // ── Bot properties ────────────────────────────────────────────────────
      case 'bot':
        return this.getBot(el);

      // ── Conditionals ──────────────────────────────────────────────────────
      case 'condition':
        return this.processCondition(el, ctx);

      // ── Random ────────────────────────────────────────────────────────────
      case 'random':
        return this.processRandom(el, ctx);

      // ── SRAI ──────────────────────────────────────────────────────────────
      case 'srai': {
        const query = (await this.processChildren(el as unknown as Node, ctx)).trim();
        return this.srai(query, ctx);
      }

      case 'sr':
        // shorthand: <srai><star/></srai>
        return this.srai(ctx.matchResult.stars[0] ?? '', ctx);

      // ── SRAIX (external service) ──────────────────────────────────────────
      case 'sraix':
        return this.processSraix(el, ctx);

      // ── Learn ─────────────────────────────────────────────────────────────
      case 'learn':
      case 'learnf':
        return this.processLearn(el, ctx, tag === 'learnf');

      // ── History ───────────────────────────────────────────────────────────
      case 'input':
        return this.getInput(el, ctx);
      case 'request':
        return this.getInput(el, ctx); // AIML 2.0 alias
      case 'that':
        return this.getThat(el, ctx);
      case 'response':
        return this.getResponse(el, ctx); // AIML 2.0 alias

      // ── Bot info ──────────────────────────────────────────────────────────
      case 'version':
        return this.deps.botProperties['version'] ?? '1.0';
      case 'size':
        return String(this.deps.matcher.size);
      case 'id':
        return ctx.session.id;
      case 'date':
        return this.getDate(el);
      case 'br':
        return '\n';

      // ── System ────────────────────────────────────────────────────────────
      case 'system':
        return this.processSystem(el, ctx);

      // ── Gossip ────────────────────────────────────────────────────────────
      case 'gossip': {
        const text = await this.processChildren(el as unknown as Node, ctx);
        this.deps.onGossip?.(text);
        return '';
      }

      // ── JavaScript ────────────────────────────────────────────────────────
      case 'javascript':
        return this.processJavaScript(el, ctx);

      // ── Maps ──────────────────────────────────────────────────────────────
      case 'map':
        return this.processMap(el, ctx);

      // ── Triple store ──────────────────────────────────────────────────────
      case 'addtriple':
        return this.processAddTriple(el, ctx);
      case 'deletetriple':
        return this.processDeleteTriple(el, ctx);
      case 'select':
        return this.processSelect(el, ctx);
      case 'uniq':
        return this.processUniq(el, ctx);

      // ── List operations ───────────────────────────────────────────────────
      case 'first': {
        const content = await this.processChildren(el as unknown as Node, ctx);
        return content.trim().split(/\s+/)[0] ?? '';
      }
      case 'rest': {
        const content = await this.processChildren(el as unknown as Node, ctx);
        const words = content.trim().split(/\s+/);
        return words.slice(1).join(' ');
      }

      // ── Eval (inside learn) ───────────────────────────────────────────────
      case 'eval':
        return this.processChildren(el as unknown as Node, ctx);

      default:
        // Unknown tag — pass through inner content
        return this.processChildren(el as unknown as Node, ctx);
    }
  }

  // ─── Tag Implementations ───────────────────────────────────────────────────

  /**
   * Get the text content for a transform tag.
   * If the element has no children (self-closing), fall back to <star/> (star index 1).
   * This matches the AIML spec: <person/> == <person><star/></person>.
   */
  private async transformContent(el: Element, ctx: InterpreterContext): Promise<string> {
    const hasChildren = (el as unknown as Node).childNodes.length > 0 &&
      Array.from({ length: (el as unknown as Node).childNodes.length }, (_, i) =>
        (el as unknown as Node).childNodes.item(i),
      ).some(n => n && (n.nodeType === 1 || (n.nodeType === 3 && (n.nodeValue ?? '').trim())));

    if (!hasChildren) {
      return ctx.matchResult.stars[0] ?? '';
    }
    return this.processChildren(el as unknown as Node, ctx);
  }

  private getStar(el: Element, ctx: InterpreterContext): string {
    const idx = parseInt(getAttribute(el as unknown as Element, 'index') ?? '1', 10);
    return ctx.matchResult.stars[idx - 1] ?? '';
  }

  private getThatStar(el: Element, ctx: InterpreterContext): string {
    const idx = parseInt(getAttribute(el as unknown as Element, 'index') ?? '1', 10);
    return ctx.matchResult.thatStars[idx - 1] ?? '';
  }

  private getTopicStar(el: Element, ctx: InterpreterContext): string {
    const idx = parseInt(getAttribute(el as unknown as Element, 'index') ?? '1', 10);
    return ctx.matchResult.topicStars[idx - 1] ?? '';
  }

  private getGet(el: Element, ctx: InterpreterContext): string {
    const varAttr = getAttribute(el as unknown as Element, 'var');
    if (varAttr) {
      // Local variable: scoped to this template execution, default "unknown".
      return ctx.localVars.has(varAttr) ? ctx.localVars.get(varAttr)! : 'unknown';
    }
    const name = getAttribute(el as unknown as Element, 'name');
    if (!name) return '';
    return ctx.session.getPredicate(name);
  }

  private async processSet(el: Element, ctx: InterpreterContext): Promise<string> {
    const name = getAttribute(el as unknown as Element, 'name');
    const varAttr = getAttribute(el as unknown as Element, 'var');
    const value = (await this.processChildren(el as unknown as Node, ctx)).trim();

    if (varAttr) {
      // Local variable: store in context map (not session).
      ctx.localVars.set(varAttr, value);
    } else if (name) {
      ctx.session.setPredicate(name, value);
      if (name.toLowerCase() === 'topic') {
        ctx.session.setTopic(value);
      }
    }
    return value;
  }

  private getBot(el: Element): string {
    const name = getAttribute(el as unknown as Element, 'name') ?? '';
    return this.deps.botProperties[name.toLowerCase()] ?? '';
  }

  private getConditionValue(name: string | null | undefined, varAttr: string | null | undefined, ctx: InterpreterContext): string {
    if (varAttr) return ctx.localVars.has(varAttr) ? ctx.localVars.get(varAttr)! : 'unknown';
    if (name) return ctx.session.getPredicate(name);
    return '';
  }

  private async processCondition(el: Element, ctx: InterpreterContext): Promise<string> {
    const name = getAttribute(el as unknown as Element, 'name');
    const value = getAttribute(el as unknown as Element, 'value');
    const varAttr = getAttribute(el as unknown as Element, 'var');

    // Block condition: <condition name="pred" value="val">content</condition>
    if ((name || varAttr) && value) {
      const current = this.getConditionValue(name, varAttr, ctx);
      if (this.matchesConditionValue(current, value)) {
        return this.processChildren(el as unknown as Node, ctx);
      }
      return '';
    }

    // Multi-item condition
    const items = this.getConditionItems(el as unknown as Node);
    for (const item of items) {
      const itemName = item.name ?? name;
      const itemVar = item.varAttr ?? varAttr;
      const current = this.getConditionValue(itemName, itemVar, ctx);

      // Resolve the expected value — may be static string or dynamic node
      const expectedValue = item.valueNode
        ? (await this.processChildren(item.valueNode, ctx)).trim()
        : item.value;

      if (expectedValue === undefined) {
        const result = await this.processLiContent(item.node, ctx);
        if (item.hasLoop) return this.runConditionLoop(el, ctx, result);
        return result;
      }

      if (this.matchesConditionValue(current, expectedValue)) {
        const result = await this.processLiContent(item.node, ctx);
        if (item.hasLoop) return this.runConditionLoop(el, ctx, result);
        return result;
      }
    }
    return '';
  }

  private matchesConditionValue(current: string, expected: string): boolean {
    return current.toLowerCase() === expected.toLowerCase();
  }

  private getConditionItems(condNode: Node): Array<{
    node: Node;
    name?: string;
    varAttr?: string;
    value?: string;       // static string value (attribute form or plain text element)
    valueNode?: Node;     // dynamic value node to evaluate at match time
    hasLoop: boolean;
  }> {
    const items = [];
    for (let i = 0; i < condNode.childNodes.length; i++) {
      const child = condNode.childNodes.item(i);
      if (!child || child.nodeType !== 1) continue;
      if (getNodeName(child).toLowerCase() !== 'li') continue;

      // Attribute form: <li name="pred" value="val"> or <li var="x" value="val">
      let name = getAttribute(child as unknown as Element, 'name') ?? undefined;
      let varAttr = getAttribute(child as unknown as Element, 'var') ?? undefined;
      let value = getAttribute(child as unknown as Element, 'value') ?? undefined;
      let valueNode: Node | undefined;

      // Child-element form (AIML 2.0): <li><var>x</var><value>val</value>...</li>
      if (!name && !varAttr) {
        for (let j = 0; j < child.childNodes.length; j++) {
          const cc = child.childNodes.item(j);
          if (!cc || cc.nodeType !== 1) continue;
          const cname = getNodeName(cc).toLowerCase();
          if (cname === 'var') varAttr = this.getTextContent(cc);
          else if (cname === 'name') name = this.getTextContent(cc);
          else if (cname === 'value') {
            // If the <value> element contains only text, extract it statically.
            // If it contains child elements (e.g. <get>), store the node for
            // dynamic evaluation at match time.
            const hasChildElements = Array.from(
              { length: cc.childNodes.length },
              (_, k) => cc.childNodes.item(k),
            ).some(n => n && n.nodeType === 1);
            if (hasChildElements) {
              valueNode = cc;
            } else {
              value = this.getTextContent(cc);
            }
          }
        }
      }

      let hasLoop = false;
      for (let j = 0; j < child.childNodes.length; j++) {
        const cc = child.childNodes.item(j);
        if (cc && cc.nodeType === 1 && getNodeName(cc).toLowerCase() === 'loop') {
          hasLoop = true;
          break;
        }
      }

      items.push({ node: child, name, varAttr, value, valueNode, hasLoop });
    }
    return items;
  }

  /**
   * Process the output content of a matched `<li>` element.
   * Skips the `<var>`, `<value>`, `<name>`, and `<loop>` control elements
   * that appear in AIML 2.0 child-element form conditions — they are
   * declarations, not output.
   */
  private async processLiContent(liNode: Node, ctx: InterpreterContext): Promise<string> {
    const SKIP = new Set(['var', 'value', 'name', 'loop']);
    let result = '';
    for (let i = 0; i < liNode.childNodes.length; i++) {
      const child = liNode.childNodes.item(i);
      if (!child) continue;
      if (child.nodeType === 3 || child.nodeType === 4) {
        result += child.nodeValue ?? '';
      } else if (child.nodeType === 1) {
        if (!SKIP.has(getNodeName(child).toLowerCase())) {
          result += await this.processElement(child as unknown as Element, ctx);
        }
      }
    }
    return result;
  }

  private getTextContent(node: Node): string {
    let text = '';
    for (let i = 0; i < node.childNodes.length; i++) {
      const c = node.childNodes.item(i);
      if (c && (c.nodeType === 3 || c.nodeType === 4)) text += c.nodeValue ?? '';
    }
    return text.trim();
  }

  private async runConditionLoop(el: Element, ctx: InterpreterContext, initialResult: string): Promise<string> {
    let result = initialResult;
    for (let i = 0; i < this.deps.maxLoopIterations; i++) {
      const next = await this.processConditionLoop(el, ctx);
      if (next === null) break;        // no <li> matched — stop
      result += next.content;
      if (!next.shouldLoop) break;     // exit condition matched — stop after adding output
    }
    return result;
  }

  private async processConditionLoop(
    el: Element,
    ctx: InterpreterContext,
  ): Promise<{ content: string; shouldLoop: boolean } | null> {
    const name = getAttribute(el as unknown as Element, 'name');
    const value = getAttribute(el as unknown as Element, 'value');
    const varAttr = getAttribute(el as unknown as Element, 'var');

    if ((name || varAttr) && value) return null;

    const items = this.getConditionItems(el as unknown as Node);
    for (const item of items) {
      const itemName = item.name ?? name;
      const itemVar = item.varAttr ?? varAttr;
      const current = this.getConditionValue(itemName, itemVar, ctx);

      const expectedValue = item.valueNode
        ? (await this.processChildren(item.valueNode, ctx)).trim()
        : item.value;

      const matches = expectedValue === undefined ||
        this.matchesConditionValue(current, expectedValue);

      if (matches) {
        const content = await this.processLiContent(item.node, ctx);
        return { content, shouldLoop: item.hasLoop };
      }
    }
    return null;
  }

  private async processRandom(el: Element, ctx: InterpreterContext): Promise<string> {
    const items: Node[] = [];
    for (let i = 0; i < (el as unknown as Node).childNodes.length; i++) {
      const child = (el as unknown as Node).childNodes.item(i);
      if (child && child.nodeType === 1 && getNodeName(child).toLowerCase() === 'li') {
        items.push(child);
      }
    }
    if (items.length === 0) return '';
    const chosen = items[Math.floor(Math.random() * items.length)];
    return this.processChildren(chosen, ctx);
  }

  private async srai(input: string, ctx: InterpreterContext): Promise<string> {
    if (!input.trim()) return '';
    const normalized = this.deps.normalizer.normalize(input);
    const that = ctx.session.getThat() || '*';
    const topic = ctx.session.getTopic();

    const result = this.deps.matcher.match(normalized, that, topic);
    if (!result) return '';

    const newCtx: InterpreterContext = {
      ...ctx,
      matchResult: result,
      input: normalized,
      recursionDepth: ctx.recursionDepth + 1,
      localVars: new Map(), // fresh scope per SRAI call
    };

    return this.process(result.category.template, newCtx);
  }

  private async processSraix(el: Element, ctx: InterpreterContext): Promise<string> {
    if (!this.deps.sraix) return '';
    const service = getAttribute(el as unknown as Element, 'service') ??
                    getAttribute(el as unknown as Element, 'bot') ?? '';
    const input = await this.processChildren(el as unknown as Node, ctx);
    try {
      return await this.deps.sraix(service, input.trim(), ctx);
    } catch {
      const defaultVal = getAttribute(el as unknown as Element, 'default') ?? '';
      return defaultVal;
    }
  }

  private async processLearn(el: Element, ctx: InterpreterContext, save: boolean): Promise<string> {
    // Build AIML XML from the learn content, evaluating <eval> tags
    const xml = await this.buildLearnXML(el as unknown as Node, ctx);
    const aimlXml = `<aiml version="2.0">${xml}</aiml>`;
    if (save && this.deps.learnf) {
      await this.deps.learnf(aimlXml);
    } else {
      // Fire event for bot to handle
      (this as any)._onLearn?.(aimlXml);
    }
    return '';
  }

  private async buildLearnXML(node: Node, ctx: InterpreterContext): Promise<string> {
    let xml = '';
    for (let i = 0; i < node.childNodes.length; i++) {
      const child = node.childNodes.item(i);
      if (!child) continue;
      if (child.nodeType === 3 || child.nodeType === 4) {
        xml += child.nodeValue ?? '';
      } else if (child.nodeType === 1) {
        const name = getNodeName(child);
        if (name === 'eval') {
          xml += await this.processChildren(child, ctx);
        } else {
          const attrs = this.serializeAttributes(child as unknown as Element);
          const inner = await this.buildLearnXML(child, ctx);
          xml += `<${name}${attrs}>${inner}</${name}>`;
        }
      }
    }
    return xml;
  }

  private serializeAttributes(el: Element): string {
    let result = '';
    const attrs = el.attributes;
    if (!attrs) return result;
    for (let i = 0; i < attrs.length; i++) {
      const attr = attrs.item(i);
      if (attr) result += ` ${attr.name}="${attr.value}"`;
    }
    return result;
  }

  private getInput(el: Element, ctx: InterpreterContext): string {
    const indexStr = getAttribute(el as unknown as Element, 'index') ?? '1';
    // index can be "M,N" format for AIML 1.0 (sentence M of input N)
    const parts = indexStr.split(',');
    const inputIndex = parseInt(parts[parts.length - 1] ?? '1', 10);
    return ctx.session.getInput(inputIndex) || ctx.input;
  }

  private getThat(el: Element, ctx: InterpreterContext): string {
    const indexStr = getAttribute(el as unknown as Element, 'index') ?? '1,1';
    const parts = indexStr.split(',');
    const responseIndex = parseInt(parts[0] ?? '1', 10);
    const sentenceIndex = parseInt(parts[1] ?? '1', 10);
    return ctx.session.getThat(responseIndex, sentenceIndex);
  }

  private getResponse(el: Element, ctx: InterpreterContext): string {
    const idx = parseInt(getAttribute(el as unknown as Element, 'index') ?? '1', 10);
    return ctx.session.getResponse(idx);
  }

  private getDate(el: Element): string {
    const format = getAttribute(el as unknown as Element, 'format') ?? '%B %d, %Y';
    const now = new Date();
    // Basic date formatting
    return now.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  }

  private async processSystem(el: Element, ctx: InterpreterContext): Promise<string> {
    if (!this.deps.system) return '';
    const cmd = (await this.processChildren(el as unknown as Node, ctx)).trim();
    try {
      return await this.deps.system(cmd);
    } catch {
      return '';
    }
  }

  private async processJavaScript(el: Element, ctx: InterpreterContext): Promise<string> {
    const code = (await this.processChildren(el as unknown as Node, ctx)).trim();
    try {
      // eslint-disable-next-line no-new-func
      const fn = new Function('session', 'input', code);
      const result = fn(ctx.session, ctx.input);
      return String(result ?? '');
    } catch {
      return '';
    }
  }

  private async processMap(el: Element, ctx: InterpreterContext): Promise<string> {
    // Support both <map name="foo">key</map> and <map><name>foo</name>key</map>
    let mapName = getAttribute(el as unknown as Element, 'name');
    let keyContent = '';

    for (let i = 0; i < (el as unknown as Node).childNodes.length; i++) {
      const child = (el as unknown as Node).childNodes.item(i);
      if (!child) continue;
      if (child.nodeType === 1 && getNodeName(child).toLowerCase() === 'name') {
        mapName = mapName ?? this.getTextContent(child);
      } else if (child.nodeType === 3 || child.nodeType === 4) {
        keyContent += child.nodeValue ?? '';
      } else if (child.nodeType === 1 && getNodeName(child).toLowerCase() !== 'name') {
        keyContent += await this.processElement(child as unknown as Element, ctx);
      }
    }

    if (!mapName) return '';
    const key = keyContent.trim().toLowerCase();
    const map = this.deps.maps.get(mapName.toLowerCase());
    if (!map) return '';
    return map.get(key) ?? '';
  }

  private async processAddTriple(el: Element, ctx: InterpreterContext): Promise<string> {
    const subject = await this.getTripleField(el, ['subject', 'subj'], ctx);
    const predicate = await this.getTripleField(el, ['predicate', 'pred'], ctx);
    const object = await this.getTripleField(el, ['object', 'obj'], ctx);
    ctx.session.addTriple(subject, predicate, object);
    return '';
  }

  private async processDeleteTriple(el: Element, ctx: InterpreterContext): Promise<string> {
    const subject = await this.getTripleField(el, ['subject', 'subj'], ctx);
    const predicate = await this.getTripleField(el, ['predicate', 'pred'], ctx);
    const object = await this.getTripleField(el, ['object', 'obj'], ctx);
    ctx.session.deleteTriple(subject, predicate, object);
    return '';
  }

  private async getTripleField(
    el: Element,
    names: string[],
    ctx: InterpreterContext,
  ): Promise<string> {
    for (const name of names) {
      const val = await this.getAttrOrChild(el, name, ctx);
      if (val) return val;
    }
    return '';
  }

  private async getAttrOrChild(
    el: Element,
    name: string,
    ctx: InterpreterContext,
  ): Promise<string> {
    const attr = getAttribute(el as unknown as Element, name);
    if (attr !== null) return attr;
    for (let i = 0; i < (el as unknown as Node).childNodes.length; i++) {
      const child = (el as unknown as Node).childNodes.item(i);
      if (child && child.nodeType === 1 && getNodeName(child).toLowerCase() === name) {
        return (await this.processChildren(child, ctx)).trim();
      }
    }
    return '';
  }

  private async processSelect(el: Element, ctx: InterpreterContext): Promise<string> {
    // <select><vars><var>?x</var></vars><q><subj>?x</subj><pred>...</pred><obj>...</obj></q></select>
    const results = await this.evaluateSelect(el, ctx);
    return results.join(', ');
  }

  private async processUniq(el: Element, ctx: InterpreterContext): Promise<string> {
    // Same as select but returns unique first result
    const results = await this.evaluateSelect(el, ctx);
    return results[0] ?? '';
  }

  private async evaluateSelect(el: Element, ctx: InterpreterContext): Promise<string[]> {
    const results: string[] = [];

    // Check if there are <q> wrappers or direct subj/pred/obj children
    const hasQ = Array.from({ length: (el as unknown as Node).childNodes.length }, (_, i) =>
      (el as unknown as Node).childNodes.item(i),
    ).some(c => c && c.nodeType === 1 && getNodeName(c).toLowerCase() === 'q');

    const queryNodes: Node[] = [];
    if (hasQ) {
      for (let i = 0; i < (el as unknown as Node).childNodes.length; i++) {
        const child = (el as unknown as Node).childNodes.item(i);
        if (child && child.nodeType === 1 && getNodeName(child).toLowerCase() === 'q') {
          queryNodes.push(child);
        }
      }
    } else {
      // Direct children are the query
      queryNodes.push(el as unknown as Node);
    }

    for (const qNode of queryNodes) {
      const subj = await this.getChildText(qNode, 'subj', ctx) ||
                   await this.getChildText(qNode, 'subject', ctx);
      const pred = await this.getChildText(qNode, 'pred', ctx) ||
                   await this.getChildText(qNode, 'predicate', ctx);
      const obj = await this.getChildText(qNode, 'obj', ctx) ||
                  await this.getChildText(qNode, 'object', ctx);

      const triples = ctx.session.queryTriples(
        subj.startsWith('?') ? undefined : subj || undefined,
        pred.startsWith('?') ? undefined : pred || undefined,
        obj.startsWith('?') ? undefined : obj || undefined,
      );

      for (const triple of triples) {
        if (subj.startsWith('?')) results.push(triple.subject);
        else if (pred.startsWith('?')) results.push(triple.predicate);
        else if (obj.startsWith('?')) results.push(triple.object);
        else results.push(triple.object); // default: return object
      }
    }
    return [...new Set(results)];
  }

  private async getChildText(parent: Node, childName: string, ctx: InterpreterContext): Promise<string> {
    for (let i = 0; i < parent.childNodes.length; i++) {
      const child = parent.childNodes.item(i);
      if (child && child.nodeType === 1 && getNodeName(child).toLowerCase() === childName) {
        return (await this.processChildren(child, ctx)).trim();
      }
    }
    return '';
  }
}
