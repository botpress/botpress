import rootConfig from '../../eslint.config.mjs'

export default [
  ...rootConfig,
  {
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.json'],
        tsconfigRootDir: import.meta.dirname,
      },
    },
  },
]
