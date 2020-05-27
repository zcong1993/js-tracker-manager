import dtsPlugin from 'rollup-plugin-dts'
import esbuildPlugin from 'rollup-plugin-esbuild'
import nodeResolvePlugin from '@rollup/plugin-node-resolve'
import commonjsPlugin from '@rollup/plugin-commonjs'

const createConfig = ({ minify, format, dts } = {}) => {
  const filename = `[name]${format === 'esm' ? '.esm' : ''}${
    minify ? '.min' : ''
  }.js`
  return {
    input: 'src/index.ts',
    output: {
      format,
      name: 'index',
      dir: 'dist',
      entryFileNames: dts ? '[name].d.ts' : filename,
    },
    plugins: [
      commonjsPlugin({}),
      nodeResolvePlugin({
        extensions: dts ? ['.d.ts', '.ts'] : ['.js', '.ts', '.json', '.mjs'],
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
  // UMD format
  createConfig({ format: 'umd' }),
  // Minified UMD format
  createConfig({ format: 'umd', minify: true }),
  // ESM format
  createConfig({ format: 'esm' }),
]
