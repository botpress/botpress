import dts from 'rollup-plugin-dts'

export default {
  input: './src/index.ts',
  external: [/node_modules/],
  output: {
    file: './dist/index.d.ts',
  },
  plugins: [
    dts({
      tsconfig: './tsconfig.build.json',
    }),
  ],
}
