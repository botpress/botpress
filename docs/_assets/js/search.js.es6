import * as docsearch from 'docsearch';
// TODO Change the token for the one for botpress
docsearch({
  apiKey: '570227d66d130d069630e7226c740158',
  indexName: 'botpress',
  inputSelector: '#algolia-doc-search',
  debug: true,
});
