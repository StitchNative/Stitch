'use strict';

import Engine from './core/engine.js';
import diff from './core/diff.js';
import StdoutDriver from './driver/stdout.js';
import VRAM from './vram/buffer.js';
import { pack, unpack } from './vram/bitmask.js';
import { compose } from './vram/composer.js';
import { Rect } from './layout/constraints.js';
import { split } from './layout/ilp.js';
import { center, alignEnd, clamp } from './layout/compute.js';
import * as ansi from './driver/ansi.js';
import Arena from './kernel/arena.js';
import Reconciler from './kernel/reconciler.js';
import { useState, useEffect, bindHooks } from './kernel/hooks.js';

const kernel = {
  Arena,
  Reconciler,
  bindHooks,
};

export {
  Engine,
  diff,
  StdoutDriver,
  VRAM,
  pack,
  unpack,
  compose,
  Rect,
  split,
  center,
  alignEnd,
  clamp,
  ansi,
  kernel,
  useState,
  useEffect,
};

export default Engine;
