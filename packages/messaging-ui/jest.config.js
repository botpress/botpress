const { defaults } = require('jest-config');

module.exports = {
  bail: true,
  moduleFileExtensions: [...defaults.moduleFileExtensions, 'ts', 'tsx'],
  roots: ['.'],
  transform: {
    '^.+\\.tsx?$': 'ts-jest',
  },
  verbose: true,
  "moduleDirectories": ["node_modules", "src"]
};