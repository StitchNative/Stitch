'use strict';

/**
 * Realistic Flappy Bird Demo for Stitch Engine (50 FPS)
 * Features: Multi-character animated bird, organic clouds, tubular pipes, and ground textures.
 * Located in examples/flappy-bird.js
 */

import { Engine } from '../src/stitch.js';
import readline from 'node:readline';

const engine = new Engine();

// Configuration
const BIRD_X = 18;
const MAX_PIPES = 4;
const PIPE_WIDTH = 9;
const PIPE_GAP = 10;
const PIPE_SPACING = 60;
const FPS = 50;

// Game States
const STATE_MENU = 0;
const STATE_PLAYING = 1;
const STATE_GAMEOVER = 2;

// Pre-allocated state
const pipesX = new Int32Array(MAX_PIPES);
const pipesGapY = new Int32Array(MAX_PIPES);

const cloudsX = new Int32Array(6);
const cloudsY = new Int32Array(6);
const cloudsW = new Int32Array(6);

const starsX = new Int32Array(40);
const starsY = new Int32Array(40);
const starsSpeed = new Int8Array(40);

let gameState = STATE_MENU;
let menuSelection = 0;
let birdY = 0;
let score = 0;
let highScore = 0;
let frameCounter = 0;
let groundOffset = 0;

function randomizeGap(i) {
  const h = engine.height | 0;
  const minY = 5;
  const maxY = (h - PIPE_GAP - 6) | 0;
  const range = (maxY - minY) | 0;
  pipesGapY[i] = (minY + (Math.random() * range)) | 0;
}

function initGame() {
  const w = engine.width | 0;
  const h = engine.height | 0;
  
  birdY = (h / 2 | 0);
  score = 0;
  frameCounter = 0;
  groundOffset = 0;
  
  for (let i = 0; i < MAX_PIPES; i++) {
    pipesX[i] = (w + (i * PIPE_SPACING)) | 0;
    randomizeGap(i);
  }

  for (let i = 0; i < starsX.length; i++) {
    starsX[i] = (Math.random() * w) | 0;
    starsY[i] = (Math.random() * h) | 0;
    starsSpeed[i] = (1 + (Math.random() * 2)) | 0;
  }

  for (let i = 0; i < cloudsX.length; i++) {
    cloudsX[i] = (Math.random() * w) | 0;
    cloudsY[i] = (2 + (Math.random() * 8)) | 0;
    cloudsW[i] = (10 + (Math.random() * 15)) | 0;
  }
}

function update() {
  frameCounter = (frameCounter + 1) | 0;
  const w = engine.width | 0;
  const h = engine.height | 0;

  // Background Parallax
  if ((frameCounter % 4) === 0) {
    for (let i = 0; i < starsX.length; i++) {
      if ((frameCounter % (starsSpeed[i] * 4)) === 0) {
        starsX[i] = (starsX[i] - 1) | 0;
        if (starsX[i] < 0) {
          starsX[i] = (w - 1) | 0;
          starsY[i] = (Math.random() * h) | 0;
        }
      }
    }
  }

  // Cloud Movement (Organic)
  if ((frameCounter % 12) === 0) {
    for (let i = 0; i < cloudsX.length; i++) {
      cloudsX[i] = (cloudsX[i] - 1) | 0;
      if (cloudsX[i] + cloudsW[i] < 0) {
        cloudsX[i] = w;
        cloudsY[i] = (2 + (Math.random() * 8)) | 0;
      }
    }
  }

  // Ground Scroll
  if ((frameCounter % 5) === 0) {
    groundOffset = (groundOffset + 1) % 4;
  }

  if (gameState !== STATE_PLAYING) return;

  // Pipe Logic
  if ((frameCounter % 4) === 0) {
    for (let i = 0; i < MAX_PIPES; i++) {
      pipesX[i] = (pipesX[i] - 1) | 0;

      // Collision (Bird is 3 cells wide: BIRD_X-1 to BIRD_X+1)
      if (BIRD_X + 1 >= pipesX[i] && BIRD_X - 1 < pipesX[i] + PIPE_WIDTH) {
        if (birdY < pipesGapY[i] || birdY >= pipesGapY[i] + PIPE_GAP) {
          gameState = STATE_GAMEOVER;
        }
      }

      // Scoring
      if (pipesX[i] + PIPE_WIDTH === BIRD_X) {
        score = (score + 1) | 0;
        if (score > highScore) highScore = score;
      }

      // Recycle
      if (pipesX[i] + PIPE_WIDTH < 0) {
        pipesX[i] = (pipesX[i] + (MAX_PIPES * PIPE_SPACING)) | 0;
        randomizeGap(i);
      }
    }
  }

  // Floor Collision
  if (birdY >= h - 3) gameState = STATE_GAMEOVER;
}

function draw(vram) {
  const w = vram.width | 0;
  const h = vram.height | 0;

  // Background
  for (let i = 0; i < starsX.length; i++) {
    vram.setCell(starsX[i], starsY[i], 46, 8, 0, 0);
  }

  // Clouds (More realistic shapes)
  for (let i = 0; i < cloudsX.length; i++) {
    const cx = cloudsX[i] | 0;
    const cy = cloudsY[i] | 0;
    const cw = cloudsW[i] | 0;
    for (let dx = 0; dx < cw; dx++) {
      const x = (cx + dx) | 0;
      if (x >= 0 && x < w) {
        const char = (dx === 0 || dx === cw - 1) ? 40 : 95; // '(' or '_'
        vram.setCell(x, cy, char, 15, 0, 0);
        vram.setCell(x, cy + 1, 41, 7, 0, 0); // ')'
      }
    }
  }

  // Ground
  for (let x = 0; x < w; x++) {
    const isGrass = ((x + groundOffset) % 4) === 0;
    vram.setCell(x, h - 3, 34, 10, 2, 0); // '"' grass
    vram.setCell(x, h - 2, 176, 3, 0, 0); // '░' dirt
    vram.setCell(x, h - 1, 178, 8, 0, 0); // '▓' deep soil
  }

  if (gameState === STATE_MENU) {
    drawMenu(vram);
    return;
  }

  // Pipes (Tubular with highlights)
  for (let i = 0; i < MAX_PIPES; i++) {
    const px = pipesX[i] | 0;
    const gapY = pipesGapY[i] | 0;
    for (let dx = 0; dx < PIPE_WIDTH; dx++) {
      const x = (px + dx) | 0;
      if (x < 0 || x >= w) continue;
      
      const isEdge = (dx === 0 || dx === PIPE_WIDTH - 1);
      const isHighlight = (dx === 2);

      for (let y = 0; y < h - 3; y++) {
        if (y < gapY || y >= gapY + PIPE_GAP) {
          let color = 2;
          if (isEdge) color = 10;
          else if (isHighlight) color = 15; // White highlight for 3D effect

          const char = 9608; // '█'
          
          if (y === gapY - 1 || y === gapY + PIPE_GAP) {
             // Pipe Lips
             vram.setCell(x, y, 9619, 15, 2, 0); 
          } else {
             vram.setCell(x, y, char, color, 0, 0);
          }
        }
      }
    }
  }

  // Bird (Multi-character design)
  //   _
  // <(o)>  <- Realistic Bird Design
  //   v
  const isUp = (frameCounter % 10) < 5;
  const wing = isUp ? 94 : 118; // '^' or 'v'
  
  vram.setCell(BIRD_X, birdY, 111, 11, 0, 1);    // 'o' Eye/Body
  vram.setCell(BIRD_X - 1, birdY, 40, 11, 0, 0); // '('
  vram.setCell(BIRD_X + 1, birdY, 41, 11, 0, 0); // ')'
  vram.setCell(BIRD_X + 2, birdY, 62, 3, 0, 1);  // '>' Beak
  vram.setCell(BIRD_X, birdY - 1, wing, 15, 0, 0); // Wing

  // HUD
  const hud = ` 🐦 STITCH BIRD | SCORE: ${score} | BEST: ${highScore} `;
  drawCentered(vram, hud, 1, 15, 1, 4);

  if (gameState === STATE_GAMEOVER) {
    drawGameOver(vram);
  }
}

function drawMenu(vram) {
  const cy = (vram.height / 2) | 0;
  drawCentered(vram, "   S T I T C H   B I R D   ", cy - 4, 11, 1, 0);
  
  const opt1 = menuSelection === 0 ? ">> [  FLY NOW  ] <<" : "   [  FLY NOW  ]   ";
  const opt2 = menuSelection === 1 ? ">> [ TERMINATE ] <<" : "   [ TERMINATE ]   ";
  
  drawCentered(vram, opt1, cy, menuSelection === 0 ? 15 : 7, menuSelection === 0 ? 1 : 0);
  drawCentered(vram, opt2, cy + 2, menuSelection === 1 ? 15 : 7, menuSelection === 1 ? 1 : 0);
  
  drawCentered(vram, "USE ARROWS TO NAVIGATE | ENTER TO START", vram.height - 5, 8, 0);
}

function drawGameOver(vram) {
  const cy = (vram.height / 2) | 0;
  const boxW = 34;
  const boxH = 6;
  const bx = ((vram.width - boxW) / 2) | 0;
  const by = ((vram.height - boxH) / 2) | 0;

  for (let dy = 0; dy < boxH; dy++) {
    for (let dx = 0; dx < boxW; dx++) {
      vram.setCell(bx + dx, by + dy, 32, 0, 1, 0);
    }
  }

  drawCentered(vram, "MISSION FAILED", by + 1, 15, 1, 1);
  drawCentered(vram, `FINAL SCORE: ${score}`, by + 3, 15, 0, 1);
  drawCentered(vram, "ENTER TO REPLAY", by + 4, 11, 1, 1);
}

function drawCentered(vram, str, y, fg, attr, bg = 0) {
  const x = ((vram.width - str.length) / 2) | 0;
  if (x < 0) return;
  for (let i = 0; i < str.length; i++) {
    vram.setCell(x + i, y, str.charCodeAt(i), fg, bg, attr);
  }
}

readline.emitKeypressEvents(process.stdin);
if (process.stdin.isTTY) process.stdin.setRawMode(true);

process.stdin.on('keypress', (str, key) => {
  if (key.ctrl && key.name === 'c') {
    engine.stop();
    process.exit();
  }

  if (gameState === STATE_MENU) {
    if (key.name === 'up' || key.name === 'down') {
      menuSelection = menuSelection === 0 ? 1 : 0;
    } else if (key.name === 'return') {
      if (menuSelection === 0) {
        initGame();
        gameState = STATE_PLAYING;
      } else {
        engine.stop();
        process.exit();
      }
    }
  } else if (gameState === STATE_GAMEOVER) {
    if (key.name === 'return') {
      initGame();
      gameState = STATE_PLAYING;
    }
  } else if (gameState === STATE_PLAYING) {
    if (key.name === 'up') birdY = Math.max(2, birdY - 1) | 0;
    else if (key.name === 'down') birdY = Math.min(engine.height - 4, birdY + 1) | 0;
  }
});

engine.start();
initGame();
setInterval(() => {
  update();
  engine.render(draw);
}, 1000 / FPS);
