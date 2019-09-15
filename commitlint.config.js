module.exports = {
  extends: ['@commitlint/config-conventional'],
  rules: {
    'type-empty': [1, 'always'],
    'subject-empty': [1, 'always']
  }
}
