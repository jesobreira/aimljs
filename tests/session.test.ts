import { Session } from '../src/core/Session';

describe('Session', () => {
  let session: Session;

  beforeEach(() => {
    session = new Session('test-session');
  });

  it('has an ID', () => {
    expect(session.id).toBe('test-session');
  });

  it('gets/sets predicates', () => {
    session.setPredicate('name', 'Alice');
    expect(session.getPredicate('name')).toBe('Alice');
  });

  it('predicate names are case-insensitive', () => {
    session.setPredicate('Name', 'Alice');
    expect(session.getPredicate('name')).toBe('Alice');
    expect(session.getPredicate('NAME')).toBe('Alice');
  });

  it('returns "unknown" for missing predicate (Pandorabots convention)', () => {
    expect(session.getPredicate('missing')).toBe('unknown');
  });

  it('gets/sets topic', () => {
    session.setTopic('science');
    expect(session.getTopic()).toBe('science');
  });

  it('setTopic also sets the topic predicate', () => {
    session.setTopic('music');
    expect(session.getPredicate('topic')).toBe('music');
  });

  it('has default topic', () => {
    expect(session.getTopic()).toBe('default');
  });

  it('adds conversation turns', () => {
    session.addTurn('hello', 'hi there');
    expect(session.getInput(1)).toBe('hello');
    expect(session.getResponse(1)).toBe('hi there');
  });

  it('getInput returns most recent first', () => {
    session.addTurn('first', 'response 1');
    session.addTurn('second', 'response 2');
    expect(session.getInput(1)).toBe('second');
    expect(session.getInput(2)).toBe('first');
  });

  it('getResponse returns most recent first', () => {
    session.addTurn('first', 'response 1');
    session.addTurn('second', 'response 2');
    expect(session.getResponse(1)).toBe('response 2');
    expect(session.getResponse(2)).toBe('response 1');
  });

  it('getThat returns last response', () => {
    session.addTurn('hello', 'Hi! How are you?');
    expect(session.getThat()).toBe('Hi');
  });

  it('returns empty string for out-of-range input/response', () => {
    expect(session.getInput(99)).toBe('');
    expect(session.getResponse(99)).toBe('');
  });

  it('clears history', () => {
    session.addTurn('hello', 'hi');
    session.clearHistory();
    expect(session.getHistory()).toHaveLength(0);
  });

  describe('Triple store', () => {
    it('adds and queries triples', () => {
      session.addTriple('alice', 'likes', 'cats');
      const result = session.queryTriples('alice', 'likes', 'cats');
      expect(result).toHaveLength(1);
    });

    it('queries by subject only', () => {
      session.addTriple('alice', 'likes', 'cats');
      session.addTriple('alice', 'hates', 'dogs');
      const result = session.queryTriples('alice');
      expect(result).toHaveLength(2);
    });

    it('deletes triples', () => {
      session.addTriple('alice', 'likes', 'cats');
      session.deleteTriple('alice', 'likes', 'cats');
      const result = session.queryTriples('alice', 'likes', 'cats');
      expect(result).toHaveLength(0);
    });

    it('does not add duplicate triples', () => {
      session.addTriple('alice', 'likes', 'cats');
      session.addTriple('alice', 'likes', 'cats');
      const result = session.queryTriples('alice');
      expect(result).toHaveLength(1);
    });

    it('triple keys are case-insensitive', () => {
      session.addTriple('Alice', 'LIKES', 'Cats');
      const result = session.queryTriples('alice', 'likes', 'cats');
      expect(result).toHaveLength(1);
    });
  });

  describe('Serialization', () => {
    it('serializes and deserializes', () => {
      session.setPredicate('name', 'Alice');
      session.setTopic('science');
      session.addTurn('hello', 'hi');
      session.addTriple('a', 'b', 'c');

      const json = session.toJSON();
      const restored = Session.fromJSON(json);

      expect(restored.id).toBe(session.id);
      expect(restored.getPredicate('name')).toBe('Alice');
      expect(restored.getTopic()).toBe('science');
      expect(restored.getInput(1)).toBe('hello');
      expect(restored.getResponse(1)).toBe('hi');
      expect(restored.queryTriples('a', 'b', 'c')).toHaveLength(1);
    });

    it('getAllPredicates returns all predicates', () => {
      session.setPredicate('name', 'Alice');
      session.setPredicate('age', '30');
      const all = session.getAllPredicates();
      expect(all.name).toBe('Alice');
      expect(all.age).toBe('30');
    });
  });
});
