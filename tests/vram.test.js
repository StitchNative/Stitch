'use strict';

import test from 'node:test';
import assert from 'node:assert';
import { pack, unpack } from '../src/vram/bitmask.js';
import VRAM from '../src/vram/buffer.js';

test('bitmask pack/unpack', () => {
  const char = 65; // 'A'
  const fg = 1;    // Red
  const bg = 4;    // Blue
  const attr = 1;  // Bold

  const packed = pack(char, fg, bg, attr);
  const unpacked = unpack(packed);

  assert.strictEqual(unpacked.char, char);
  assert.strictEqual(unpacked.fg, fg);
  assert.strictEqual(unpacked.bg, bg);
  assert.strictEqual(unpacked.attr, attr);
});

test('bitmask boundaries', () => {
  const char = 0x1FFFFF;
  const fg = 15;
  const bg = 15;
  const attr = 7;

  const packed = pack(char, fg, bg, attr);
  const unpacked = unpack(packed);

  assert.strictEqual(unpacked.char, char);
  assert.strictEqual(unpacked.fg, fg);
  assert.strictEqual(unpacked.bg, bg);
  assert.strictEqual(unpacked.attr, attr);
});

test('VRAM initialization and setCell', () => {
  const vram = new VRAM(10, 5);
  assert.strictEqual(vram.width, 10);
  assert.strictEqual(vram.height, 5);
  assert.strictEqual(vram.size, 50);

  vram.setCell(2, 2, 65, 1, 0, 0);
  const val = vram.getCell(2, 2);
  const unpacked = unpack(val);

  assert.strictEqual(unpacked.char, 65);
  assert.strictEqual(unpacked.fg, 1);
});

test('VRAM clear', () => {
  const vram = new VRAM(10, 5);
  vram.setCell(0, 0, 65, 1, 1, 1);
  vram.clear(0);
  assert.strictEqual(vram.getCell(0, 0), 0);
});

test('VRAM swap', () => {
  const vram = new VRAM(10, 5);
  vram.setCell(5, 2, 66, 2, 0, 0);
  vram.swap();
  assert.strictEqual(vram.frontBuffer[2 * 10 + 5], vram.backBuffer[2 * 10 + 5]);
});

test('VRAM composition', () => {
  const target = new VRAM(10, 10);
  const layer1 = new VRAM(10, 10); // Bottom
  const layer2 = new VRAM(10, 10); // Top

  layer1.setCell(0, 0, 65, 1, 0, 0); // 'A'
  layer2.setCell(0, 0, 66, 2, 0, 0); // 'B' (should win)
  layer1.setCell(1, 1, 67, 3, 0, 0); // 'C' (should remain as layer2 is empty here)

  target.compose([layer1, layer2]);

  const cell00 = unpack(target.getCell(0, 0));
  const cell11 = unpack(target.getCell(1, 1));

  assert.strictEqual(cell00.char, 66);
  assert.strictEqual(cell00.fg, 2);
  assert.strictEqual(cell11.char, 67);
  assert.strictEqual(cell11.fg, 3);
});

test('VRAM out-of-bounds', () => {
  const vram = new VRAM(10, 10);
  
  // Should not throw
  vram.setCell(-1, 0, 65, 1, 0, 0);
  vram.setCell(10, 0, 65, 1, 0, 0);
  vram.setCell(0, -1, 65, 1, 0, 0);
  vram.setCell(0, 10, 65, 1, 0, 0);
  
  assert.strictEqual(vram.getCell(-1, 0), 0);
  assert.strictEqual(vram.getCell(10, 0), 0);
});
