'use strict';

import test from 'node:test';
import assert from 'node:assert';
import Arena from '../src/kernel/arena.js';
import Reconciler from '../src/kernel/reconciler.js';
import { bindHooks, useState } from '../src/kernel/hooks.js';

test('Arena dynamic resizing', () => {
  const arena = new Arena(10);
  for (let i = 0; i < 20; i++) {
    arena.alloc();
  }
  assert.strictEqual(arena.capacity >= 20, true);
});

test('Reconciler stable hashing', () => {
  const arena = new Arena();
  const rec = new Reconciler(arena);
  
  const ptr1 = rec.claim('Component', 1, 0, null);
  const ptr2 = rec.claim('Component', 1, 0, null);
  const ptr3 = rec.claim('Component', 1, 1, null);
  
  assert.strictEqual(ptr1, ptr2);
  assert.notStrictEqual(ptr1, ptr3);
});

test('Reconciler collision resistance', () => {
  const arena = new Arena();
  const rec = new Reconciler(arena);
  
  // These should NOT collide despite having values that XOR to the same result
  // If they collide, the reconciler is using a weak hashing strategy.
  const ptrA = rec.claim('A', 1, 0, null);
  const ptrB = rec.claim('B', 0, 2, null);
  
  assert.notStrictEqual(ptrA, ptrB, 'Reconciler should not have collisions for different component paths');
});

test('Hook state and epoch validation', () => {
  const arena = new Arena();
  const rec = new Reconciler(arena);
  bindHooks(rec);

  const ptr = rec.claim('Test', 0, 0, null);
  rec.enter(ptr);
  
  const [val, setVal] = useState(0);
  assert.strictEqual(val, 0);
  
  setVal(1);
  assert.strictEqual(arena.refs[ptr][0], 1);
  assert.strictEqual(arena.isDirty(ptr), true);
  
  // Simulate re-render or unmount (increment epoch for THIS slot)
  const metaPtr = (ptr << 2) | 0;
  arena.meta[(metaPtr + 1) | 0] = (arena.meta[(metaPtr + 1) | 0] + 1) | 0;
  
  // Try stale update
  setVal(2);
  assert.strictEqual(arena.refs[ptr][0], 1); // Value should NOT change
});

test('Memory safety (free)', () => {
  const arena = new Arena();
  const ptr = arena.alloc();
  arena.refs[ptr] = { data: 'leak' };
  
  arena.free(ptr);
  assert.strictEqual(arena.refs[ptr], null);
});

import { useEffect } from '../src/kernel/hooks.js';

test('useEffect dependency tracking', () => {
  const arena = new Arena();
  const rec = new Reconciler(arena);
  bindHooks(rec);

  const ptr = rec.claim('Test', 0, 0, null);
  rec.enter(ptr);

  let count = 0;
  const effect = () => { count++; };

  // First run
  useEffect(effect, [1]);
  assert.strictEqual(count, 1);

  // Second run with same deps
  rec.hookCursor = 0; // Reset cursor for re-render
  useEffect(effect, [1]);
  assert.strictEqual(count, 1); // Should NOT run

  // Third run with different deps
  rec.hookCursor = 0;
  useEffect(effect, [2]);
  assert.strictEqual(count, 2); // SHOULD run
});
