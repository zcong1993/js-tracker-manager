import dtsPlugin from 'rollup-plugin-dts'
import esbuildPlugin from 'rollup-plugin-esbuild'
import nodeResolvePlugin from '@rollup/plugin-node-resolve'
import commonjsPlugin from '@rollup/plugin-commonjs'

const createConfig = ({ minify, format, dts, forBrowser } = {}) => {
  let f = ''
  if (format === 'umd') {
    f = '.browser'
  }
  if (format === 'es') {
    f = '.browser.esm'
  }
  const filename = `[name]${f}${minify ? '.min' : ''}.js`
  return {
    input: 'src/index.ts',
    output: {
      format,
      name: 'trackerManager',
      dir: 'dist',
      entryFileNames: dts ? '[name].d.ts' : filename,
    },
    plugins: [
      commonjsPlugin({}),
      nodeResolvePlugin({
        extensions: dts ? ['.d.ts', '.ts'] : ['.js', '.ts', '.json', '.mjs'],
        browser: !!forBrowser,
      }),
      !dts &&
        esbuildPlugin({
          minify,
        }),
      dts && dtsPlugin(),
    ].filter(Boolean),
  }
}

export default [
  // Generate types
  createConfig({ dts: true }),
  // cjs
  createConfig({ format: 'cjs' }),
  // UMD format
  createConfig({ format: 'umd', forBrowser: true }),
  // Minified UMD format
  createConfig({ format: 'umd', minify: true, forBrowser: true }),
  // ES format
  createConfig({ format: 'es', minify: true, forBrowser: true }),
]
