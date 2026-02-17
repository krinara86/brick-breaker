import { describe, it, expect, vi, beforeEach } from 'vitest';
import { EventBus } from '../../types/events';

describe('EventBus', () => {
  let bus: EventBus;

  beforeEach(() => {
    bus = new EventBus();
  });

  it('should emit and receive events', () => {
    const handler = vi.fn();
    bus.on('brick:destroyed', handler);
    bus.emit('brick:destroyed', { row: 0, col: 1, points: 10 });

    expect(handler).toHaveBeenCalledOnce();
    expect(handler).toHaveBeenCalledWith({ row: 0, col: 1, points: 10 });
  });

  it('should support multiple handlers for the same event', () => {
    const handler1 = vi.fn();
    const handler2 = vi.fn();
    bus.on('ball:lost', handler1);
    bus.on('ball:lost', handler2);
    bus.emit('ball:lost', { livesRemaining: 2 });

    expect(handler1).toHaveBeenCalledOnce();
    expect(handler2).toHaveBeenCalledOnce();
  });

  it('should return an unsubscribe function', () => {
    const handler = vi.fn();
    const unsub = bus.on('game:start', handler);

    bus.emit('game:start', { level: 1 });
    expect(handler).toHaveBeenCalledOnce();

    unsub();
    bus.emit('game:start', { level: 2 });
    expect(handler).toHaveBeenCalledOnce(); // Still 1, not 2
  });

  it('should remove a specific handler with off()', () => {
    const handler1 = vi.fn();
    const handler2 = vi.fn();
    bus.on('game:pause', handler1);
    bus.on('game:pause', handler2);

    bus.off('game:pause', handler1);
    bus.emit('game:pause', undefined);

    expect(handler1).not.toHaveBeenCalled();
    expect(handler2).toHaveBeenCalledOnce();
  });

  it('should remove all handlers for an event with off(event)', () => {
    const handler = vi.fn();
    bus.on('game:resume', handler);

    bus.off('game:resume');
    bus.emit('game:resume', undefined);

    expect(handler).not.toHaveBeenCalled();
  });

  it('should clear all handlers', () => {
    const handler1 = vi.fn();
    const handler2 = vi.fn();
    bus.on('game:start', handler1);
    bus.on('ball:lost', handler2);

    bus.clear();
    bus.emit('game:start', { level: 1 });
    bus.emit('ball:lost', { livesRemaining: 0 });

    expect(handler1).not.toHaveBeenCalled();
    expect(handler2).not.toHaveBeenCalled();
  });

  it('should not throw when emitting with no handlers', () => {
    expect(() => {
      bus.emit('game:over', { score: 100, level: 3 });
    }).not.toThrow();
  });

  it('should catch errors in handlers without breaking other handlers', () => {
    const errorHandler = vi.fn(() => { throw new Error('oops'); });
    const goodHandler = vi.fn();
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    bus.on('brick:hit', errorHandler);
    bus.on('brick:hit', goodHandler);
    bus.emit('brick:hit', { row: 0, col: 0, hitsLeft: 1 });

    expect(errorHandler).toHaveBeenCalledOnce();
    expect(goodHandler).toHaveBeenCalledOnce();
    expect(consoleSpy).toHaveBeenCalled();

    consoleSpy.mockRestore();
  });
});
