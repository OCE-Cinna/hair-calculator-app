#!/usr/bin/env node
/* global process */
/**
 * compress-glb.js
 * ─────────────────────────────────────────────────────────────────
 * Compresses one or more GLB files to under 500 KB using Draco mesh
 * compression + WebP texture compression via @gltf-transform/core.
 *
 * Usage:
 *   node scripts/compress-glb.js <input.glb> [output.glb]
 *   node scripts/compress-glb.js public/models/custom_bust.glb
 *   node scripts/compress-glb.js public/models/custom_bust.glb public/models/custom_bust_compressed.glb
 *
 * Or via npm script:
 *   npm run compress-glb -- public/models/custom_bust.glb
 *
 * If no output path is given, the input file is overwritten in-place.
 * ─────────────────────────────────────────────────────────────────
 */

import { NodeIO } from '@gltf-transform/core';
import { ALL_EXTENSIONS } from '@gltf-transform/extensions';
import {
  dedup,
  flatten,
  join,
  weld,
  simplify,
  prune,
  sparse,
  draco,
  textureCompress,
  resample,
  instance,
} from '@gltf-transform/functions';
import { MeshoptSimplifier } from 'meshoptimizer';
import draco3d from 'draco3dgltf';
import sharp from 'sharp';
import { statSync, existsSync } from 'fs';
import { resolve, basename } from 'path';

// ─── Config ──────────────────────────────────────────────────────
const TARGET_BYTES   = 500 * 1024;  // 500 KB
const MAX_PASSES     = 6;           // Max compression attempts before giving up

// Each pass reduces quantization precision progressively
const PASSES = [
  { position: 14, normal: 10, texcoord: 12, simplifyRatio: 0.8 },
  { position: 12, normal: 8,  texcoord: 10, simplifyRatio: 0.6 },
  { position: 11, normal: 8,  texcoord: 10, simplifyRatio: 0.4 },
  { position: 10, normal: 7,  texcoord: 9,  simplifyRatio: 0.3 },
  { position: 9,  normal: 7,  texcoord: 8,  simplifyRatio: 0.2 },
  { position: 8,  normal: 6,  texcoord: 7,  simplifyRatio: 0.1 },
];

// ─── Helpers ─────────────────────────────────────────────────────
function formatBytes(bytes) {
  if (bytes < 1024)       return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

function fileSize(path) {
  return existsSync(path) ? statSync(path).size : 0;
}

// ─── Main ─────────────────────────────────────────────────────────
async function compressGLB(inputPath, outputPath) {
  inputPath  = resolve(inputPath);
  outputPath = resolve(outputPath || inputPath);

  if (!existsSync(inputPath)) {
    console.error(`❌  File not found: ${inputPath}`);
    process.exit(1);
  }

  const originalSize = fileSize(inputPath);
  console.log(`\n📦  ${basename(inputPath)}`);
  console.log(`    Original size : ${formatBytes(originalSize)}`);

  if (originalSize <= TARGET_BYTES) {
    console.log(`    ✅ Already under 500 KB — no compression needed.\n`);
    return;
  }

  // Set up I/O with Draco encoder/decoder
  const io = new NodeIO()
    .registerExtensions(ALL_EXTENSIONS)
    .registerDependencies({
      'draco3d.encoder': await draco3d.createEncoderModule(),
      'draco3d.decoder': await draco3d.createDecoderModule(),
    });

  await MeshoptSimplifier.ready;

  let finalSize = originalSize;
  let success   = false;

  for (let i = 0; i < PASSES.length; i++) {
    const pass = PASSES[i];
    console.log(`\n    ⚙️  Pass ${i + 1}/${PASSES.length} — pos:${pass.position}bit  norm:${pass.normal}bit  uv:${pass.texcoord}bit  simplify:${Math.round(pass.simplifyRatio * 100)}%`);

    // Read fresh each pass (we write to a temp path first)
    const doc = await io.read(inputPath);

    // --- Optimisation pipeline ---
    await doc.transform(
      dedup(),
      instance(),
      flatten(),
      join(),
      weld(),
      simplify({ simplifier: MeshoptSimplifier, ratio: pass.simplifyRatio, error: 0.0005 }),
      resample(),
      prune(),
      sparse(),
      textureCompress({
        encoder: sharp,
        targetFormat: 'webp',
        resize: [1024, 1024],   // Cap textures at 1K for mobile performance
      }),
      draco({
        quantizePosition: pass.position,
        quantizeNormal:   pass.normal,
        quantizeTexcoord: pass.texcoord,
        quantizeColor:    8,
      }),
    );

    await io.write(outputPath, doc);

    finalSize = fileSize(outputPath);
    console.log(`    → ${formatBytes(finalSize)}`);

    if (finalSize <= TARGET_BYTES) {
      success = true;
      break;
    }
  }

  console.log('');

  if (success) {
    const saving = ((1 - finalSize / originalSize) * 100).toFixed(1);
    console.log(`    ✅  Compressed: ${formatBytes(originalSize)} → ${formatBytes(finalSize)} (${saving}% smaller)`);
    if (outputPath === inputPath) {
      console.log(`    📁  Saved in-place: ${outputPath}`);
    } else {
      console.log(`    📁  Output: ${outputPath}`);
    }
  } else {
    console.warn(`    ⚠️  Could not get below 500 KB (best: ${formatBytes(finalSize)}).`);
    console.warn(`       The mesh may already be at minimum detail. Consider reducing the source mesh in Blender.\n`);
  }
  console.log('');
}

// ─── CLI entry ────────────────────────────────────────────────────
const [,, inputArg, outputArg] = process.argv;

if (!inputArg) {
  console.log(`
Usage:
  node scripts/compress-glb.js <input.glb> [output.glb]

Examples:
  node scripts/compress-glb.js public/models/custom_bust.glb
  node scripts/compress-glb.js public/models/custom_bust.glb public/models/bust_small.glb
  `);
  process.exit(0);
}

compressGLB(inputArg, outputArg).catch((err) => {
  console.error('❌  Error:', err.message);
  process.exit(1);
});
