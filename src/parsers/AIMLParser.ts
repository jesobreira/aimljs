/**
 * @module AIMLParser
 * @category Parsers
 */
import { parseXML, getAttribute, getNodeName } from '../utils/domParser';
import { parsePattern, WILDCARD_STAR } from '../core/PatternMatcher';
import type { Category, ValidationResult, ValidationError } from '../types';
import { generateId } from '../utils/uid';

/**
 * The result of parsing an AIML XML document.
 *
 * @see {@link parseAIML}
 */
export interface ParsedAIML {
  /** All successfully parsed categories. */
  categories: Category[];
  /** Detected AIML version from the root `<aiml version="...">` attribute. */
  version: '1.0' | '2.0';
  /** Fatal parse errors that prevented specific categories from loading. */
  errors: ValidationError[];
  /** Non-fatal warnings (e.g. empty patterns). */
  warnings: ValidationError[];
}

/**
 * Parse an AIML XML string into a list of {@link Category} objects.
 *
 * Supports both AIML 1.0 and 2.0 syntax.  The version is auto-detected
 * from the `version` attribute on the root `<aiml>` element.
 *
 * Features handled:
 * - `<category>` elements at the root level
 * - `<topic name="...">` wrappers
 * - `<that>` context inside categories
 * - `<set name="...">` and `<set>name</set>` in patterns (both forms)
 * - `<bot name="...">` in patterns
 *
 * @param xml            Raw AIML XML string.
 * @param fileName       Optional source file name (used in error messages).
 * @param defaultVersion Version to assume if the `<aiml>` tag has no `version` attribute.
 * @returns              Parsed result including categories, errors, and warnings.
 *
 * @example
 * ```ts
 * const xml = `<aiml version="1.0">
 *   <category>
 *     <pattern>HELLO</pattern>
 *     <template>Hi!</template>
 *   </category>
 * </aiml>`;
 *
 * const { categories, errors } = parseAIML(xml, 'greetings.aiml');
 * console.log(categories.length); // 1
 * ```
 *
 * @category Parsers
 */
export function parseAIML(
  xml: string,
  fileName?: string,
  defaultVersion: '1.0' | '2.0' = '1.0',
): ParsedAIML {
  const errors: ValidationError[] = [];
  const warnings: ValidationError[] = [];
  const categories: Category[] = [];

  let doc: Document;
  try {
    doc = parseXML(xml) as unknown as Document;
  } catch (e) {
    errors.push({ message: String(e), file: fileName });
    return { categories, version: defaultVersion, errors, warnings };
  }

  const root = doc.documentElement;
  if (!root) {
    errors.push({ message: 'No root element found', file: fileName });
    return { categories, version: defaultVersion, errors, warnings };
  }

  const rootName = getNodeName(root as unknown as Node);
  if (rootName !== 'aiml') {
    errors.push({ message: `Root element must be <aiml>, got <${rootName}>`, file: fileName });
    return { categories, version: defaultVersion, errors, warnings };
  }

  const versionAttr = getAttribute(root as unknown as Element, 'version');
  const aimlVersion: '1.0' | '2.0' =
    versionAttr?.startsWith('2') ? '2.0' : defaultVersion;

  processChildren(
    root as unknown as Node,
    WILDCARD_STAR.raw,
    WILDCARD_STAR.raw,   // default topic: * (match any topic)
    aimlVersion,
    categories,
    errors,
    warnings,
    fileName,
  );

  return { categories, version: aimlVersion, errors, warnings };
}

function processChildren(
  parent: Node,
  defaultThat: string,
  defaultTopic: string,
  version: '1.0' | '2.0',
  categories: Category[],
  errors: ValidationError[],
  warnings: ValidationError[],
  fileName?: string,
): void {
  for (let i = 0; i < parent.childNodes.length; i++) {
    const node = parent.childNodes.item(i);
    if (!node || node.nodeType !== 1) continue;
    const name = getNodeName(node);

    if (name === 'category') {
      const cat = parseCategory(node, defaultThat, defaultTopic, version, errors, warnings, fileName);
      if (cat) categories.push(cat);
    } else if (name === 'topic') {
      const topicName = getAttribute(node as unknown as Element, 'name') ?? '*';
      processChildren(node, defaultThat, topicName, version, categories, errors, warnings, fileName);
    }
  }
}

function parseCategory(
  node: Node,
  defaultThat: string,
  defaultTopic: string,
  version: '1.0' | '2.0',
  errors: ValidationError[],
  warnings: ValidationError[],
  fileName?: string,
): Category | null {
  let patternNode: Node | null = null;
  let thatNode: Node | null = null;
  let topicNode: Node | null = null;
  let templateNode: Node | null = null;

  for (let i = 0; i < node.childNodes.length; i++) {
    const child = node.childNodes.item(i);
    if (!child || child.nodeType !== 1) continue;
    const name = getNodeName(child);
    if (name === 'pattern') patternNode = child;
    else if (name === 'that') thatNode = child;
    else if (name === 'topic') topicNode = child;
    else if (name === 'template') templateNode = child;
  }

  if (!patternNode) {
    errors.push({ message: '<category> missing <pattern>', file: fileName, element: 'category' });
    return null;
  }
  if (!templateNode) {
    errors.push({ message: '<category> missing <template>', file: fileName, element: 'category' });
    return null;
  }

  const patternText = getInnerText(patternNode).trim();
  if (!patternText) {
    warnings.push({ message: '<pattern> is empty', file: fileName, element: 'pattern' });
  }

  const thatText = thatNode ? getInnerText(thatNode).trim() : defaultThat;
  const topicText = topicNode ? getInnerText(topicNode).trim() : defaultTopic;

  return {
    id: generateId('cat'),
    pattern: parsePattern(patternText, version),
    that: parsePattern(thatText || '*', version),
    topic: parsePattern(topicText || '*', version),
    template: templateNode,
    file: fileName,
    aimlVersion: version,
  };
}

function getInnerText(node: Node): string {
  let text = '';
  for (let i = 0; i < node.childNodes.length; i++) {
    const child = node.childNodes.item(i);
    if (!child) continue;
    if (child.nodeType === 3 || child.nodeType === 4) {
      text += child.nodeValue ?? '';
    } else if (child.nodeType === 1) {
      const name = getNodeName(child);
      const nameAttr = getAttribute(child as unknown as Element, 'name') ?? '';
      if (name === 'set') {
        const setName = nameAttr || getInnerText(child).trim();
        text += `<set name="${setName}">`;
      } else if (name === 'bot') {
        text += `<bot name="${nameAttr}">`;
      } else {
        text += getInnerText(child);
      }
    }
  }
  return text;
}

/**
 * Validate an AIML XML string without loading it into a bot.
 *
 * A convenience wrapper around {@link parseAIML} that returns only the
 * validation result.
 *
 * @param xml      AIML XML string to validate.
 * @param fileName Optional source file name for error messages.
 *
 * @example
 * ```ts
 * const result = validateAIML(xmlString, 'mybot.aiml');
 * if (!result.valid) {
 *   result.errors.forEach(e => console.error(e.message));
 * }
 * ```
 *
 * @category Parsers
 */
export function validateAIML(xml: string, fileName?: string): ValidationResult {
  const { errors, warnings } = parseAIML(xml, fileName);
  return { valid: errors.length === 0, errors, warnings };
}
