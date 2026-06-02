import { DOMParser as XmlDOMParser, Node as XmlNode } from '@xmldom/xmldom';

export function parseXML(xml: string): Document {
  // Prefer native DOMParser in browser environments
  if (typeof globalThis.DOMParser !== 'undefined') {
    const parser = new globalThis.DOMParser();
    const doc = parser.parseFromString(xml, 'text/xml');
    const parseError = doc.querySelector?.('parsererror');
    if (parseError) {
      throw new Error(`XML parse error: ${parseError.textContent}`);
    }
    return doc as unknown as Document;
  }

  const parser = new XmlDOMParser({
    errorHandler: (level: string, msg: string) => {
      if (level === 'error' || level === 'fatalError') {
        throw new Error(`XML parse error: ${msg}`);
      }
    },
  });
  return parser.parseFromString(xml, 'text/xml') as unknown as Document;
}

export function getChildren(node: Node): Element[] {
  const children: Element[] = [];
  for (let i = 0; i < node.childNodes.length; i++) {
    const child = node.childNodes.item(i);
    if (child && child.nodeType === 1 /* ELEMENT_NODE */) {
      children.push(child as Element);
    }
  }
  return children;
}

export function getTextContent(node: Node): string {
  let text = '';
  for (let i = 0; i < node.childNodes.length; i++) {
    const child = node.childNodes.item(i);
    if (!child) continue;
    if (child.nodeType === 3 /* TEXT_NODE */ || child.nodeType === 4 /* CDATA_NODE */) {
      text += child.nodeValue ?? '';
    } else if (child.nodeType === 1 /* ELEMENT_NODE */) {
      text += getTextContent(child);
    }
  }
  return text;
}

export function getAttribute(el: Element, name: string): string | null {
  return el.getAttribute(name);
}

export function getNodeName(node: Node): string {
  return (node.nodeName || '').toLowerCase();
}

export { XmlNode };
