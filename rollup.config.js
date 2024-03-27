import terser from '@rollup/plugin-terser';
import pkg from './package.json' assert { type: "json" };

import typescript from "rollup-plugin-typescript2";
import { dts } from "rollup-plugin-dts";

const name = 'seo-analyzer';
const input = 'src/index.js';
const external = [
  'fs',
  'path',
  'jsdom'
];
const globals = {
  fs: 'fs',
  path: 'path',
  jsdom: 'jsdom'
};

export default [
  {
    external,
    input,
    output: { file: pkg.main, format: 'es', globals, inlineDynamicImports: true },
    //plugins: [terser()]
  plugins: [
    typescript({
      rollupCommonJSResolveHack: false,
      clean: true,
    })
  ]
  },
  {
    external,
    input,
    output: { file: pkg.commonjs, format: 'umd', name, sourcemap: true, globals, inlineDynamicImports: true },
    //plugins: [terser()]
  plugins: [
    typescript({
      rollupCommonJSResolveHack: false,
      clean: true,
    })
  ]
  },
  {
    external,
    input,
    output: { file: pkg.browser, format: 'umd', name, sourcemap: true, globals, inlineDynamicImports: true },
    //plugins: [terser()]
  plugins: [
    typescript({
      rollupCommonJSResolveHack: false,
      clean: true,
    })
  ]
  },
  {
    input: "./types/index.d.ts",
    output: [{ file: "dist/seo-analyzer.d.ts", format: "es" }],
    //plugins: [dts()],,
  plugins: [
    dts(),
    typescript({
      rollupCommonJSResolveHack: false,
      clean: true,
    })
  ]
  },
];
