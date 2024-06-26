import test from 'ava';
import metaBaseRule from '../../src/rules/MetaBaseRule.js';

const fakeDOM = content => ({
      querySelector: () => content

});

test('if document not exists base meta tags description & viewport, return ["This HTML is missing a <meta name="description"> tag", "This HTML is missing a <meta name="viewport"> tag"]', async t => {
  const options = { names: ['description', 'viewport'] };
  const result = await metaBaseRule(fakeDOM(), options);
  t.deepEqual(result, ['This HTML is missing a <meta name="description"> tag', 'This HTML is missing a <meta name="viewport"> tag']);
});

test('if document exists base meta tags description & viewport but content is empty, return ["The content attribute for the <meta name="description" content=""> tag is empty", "The content attribute for the <meta name="viewport" content=""> tag is empty"]', async t => {
  const options = { names: ['description', 'viewport'] };
  const result = await metaBaseRule(fakeDOM({ content: '' }), options);
  t.deepEqual(result, ['The content attribute for the <meta name="description" content=""> tag is empty', 'The content attribute for the <meta name="viewport" content=""> tag is empty']);
});

test('if document exists base meta tags description & viewport, return []', async t => {
  const options = { names: ['description', 'viewport'] };
  const result = await metaBaseRule(fakeDOM({ content: 'content' }), options);
  t.deepEqual(result, []);
});

test('if names is empty, return []', async t => {
  const options = { names: [] };
  const result = await metaBaseRule(fakeDOM(), options);
  t.deepEqual(result, []);
});
