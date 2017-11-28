import * as docsearch from 'docsearch';
// TODO Change the token for the one for botpress
docsearch({
  apiKey: '5735bfc8e574388155a4d85de48e6893',
  appId: 'W4TGY1LV0J',
  indexName: 'dev_BOTPRESS-X-DOC',
  inputSelector: '#algolia-doc-search',
  debug: true,
});
