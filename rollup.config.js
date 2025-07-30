const typescript = require('@rollup/plugin-typescript')
const resolve = require('@rollup/plugin-node-resolve')
const alias = require('@rollup/plugin-alias')
const path = require('path')

const dirnameNew = path.dirname(__dirname)

module.exports = {
  input: 'src/index.ts',
  output: [
    {
      file: 'dist/bundle.cjs.js',
      format: 'cjs'
    },
    {
      file: 'dist/bundle.esm.js',
      format: 'es'
    }
  ],
  plugins: [
    typescript({
      exclude: 'node_modules/**',
      tsconfig: './tsconfig.json'
    }),
    alias({
      resolve: ['.js', 'ts'],
      entries: {
        find: '@',
        replacement: path.resolve(dirnameNew, 'src')
      }
    }),
    resolve()
  ]
}
