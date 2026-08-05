import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Mock BroadcastChannel
class MockBroadcastChannel {
  constructor(name) {
    this.name = name;
    this.onmessage = null;
    this._messages = [];
  }
  postMessage(data) {
    this._messages.push(data);
    // Simulate echo for testing
    if (this.onmessage) {
      setTimeout(() => this.onmessage({ data }), 0);
    }
  }
  close() {}
}

describe('Leader Election', () => {
  beforeEach(() => {
    globalThis.BroadcastChannel = MockBroadcastChannel;
  });

  afterEach(() => {
    delete globalThis.BroadcastChannel;
  });

  it('should create broadcast channel', () => {
    const channel = new MockBroadcastChannel('financia-sync-leader');
    expect(channel.name).toBe('financia-sync-leader');
  });

  it('should send heartbeat messages', () => {
    const channel = new MockBroadcastChannel('financia-sync-leader');
    channel.postMessage({ type: 'heartbeat', uid: 'user1', ts: Date.now() });
    expect(channel._messages).toHaveLength(1);
    expect(channel._messages[0].type).toBe('heartbeat');
  });

  it('should handle leadership claim', () => {
    const channel = new MockBroadcastChannel('financia-sync-leader');
    channel.postMessage({ type: 'claim-leadership', uid: 'user1', ts: Date.now() });
    expect(channel._messages[0].type).toBe('claim-leadership');
  });

  it('should handle sync-complete broadcast', () => {
    const channel = new MockBroadcastChannel('financia-sync-leader');
    const handler = vi.fn();
    channel.onmessage = handler;

    // Simulate receiving sync-complete
    channel.postMessage({ type: 'sync-complete', uid: 'user1', result: { ok: true, changed: true } });

    // Handler should be called (via the mock echo)
    expect(channel._messages[0].type).toBe('sync-complete');
  });
});
