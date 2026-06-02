let counter = 0;

export function generateId(prefix = 'id'): string {
  const time = typeof performance !== 'undefined' ? performance.now() : Date.now();
  return `${prefix}-${Math.floor(time * 1000)}-${++counter}`;
}
