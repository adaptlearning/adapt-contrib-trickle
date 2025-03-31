import { describe, whereContent, whereFromPlugin, mutateContent, checkContent, updatePlugin, testStopWhere, testSuccessWhere } from 'adapt-migrations';
import _ from 'lodash';

describe('Trickle - v3.0.1 to v4.0.0', async () => {
  // https://github.com/adaptlearning/adapt-contrib-trickle/compare/v3.0.1..v4.0.0
  let configuredBlocks, configuredArticles;

  whereFromPlugin('Trickle - from v3.0.1', { name: 'adapt-contrib-trickle', version: '<4.0.0' });

  whereContent('Trickle is configured', content => {
    configuredBlocks = content.filter(({ _type, _trickle }) => _trickle && _type === 'block');
    configuredArticles = content.filter(({ _type, _trickle }) => _trickle && _type === 'article');
    return configuredBlocks.length || configuredArticles.length;
  });

  mutateContent('Trickle - add block attribute _hasIcon', async (content) => {
    configuredBlocks.forEach(block => {
      if (!_.has(block._trickle, '_button')) _.set(block._trickle, '_button', {});
      block._trickle._button._hasIcon = false;
    });
    return true;
  });

  mutateContent('Trickle - add article attribute _hasIcon', async (content) => {
    configuredArticles.forEach(article => {
      if (!_.has(article._trickle, '_button')) _.set(article._trickle, '_button', {});
      article._trickle._button._hasIcon = false;
    });
    return true;
  });

  checkContent('Trickle - check block attribute _hasIcon', async (content) => {
    const isValid = configuredBlocks.every(block => block._trickle._button._hasIcon === false);
    if (!isValid) throw new Error('Trickle - block attribute _hasIcon');
    return true;
  });

  checkContent('Trickle - check article attribute _hasIcon', async (content) => {
    const isValid = configuredArticles.every(article => article._trickle._button._hasIcon === false);
    if (!isValid) throw new Error('Trickle - article attribute _hasIcon');
    return true;
  });

  updatePlugin('Trickle - update to v4.0.0', { name: 'adapt-contrib-trickle', version: '4.0.0', framework: '>=5.0.0' });

  testSuccessWhere('trickle with both configured/non configured articles/blocks and default article/block._trickle._button', {
    fromPlugins: [{ name: 'adapt-contrib-trickle', version: '3.0.1' }],
    content: [
      { _type: 'article', _trickle: { _button: {} } },
      { _type: 'article', _trickle: {} },
      { _type: 'article' },
      { _type: 'block', _trickle: { _button: {} } },
      { _type: 'block', _trickle: {} },
      { _type: 'block' },
      { _type: 'config', _trickle: {} }
    ]
  });

  testStopWhere('trickle with no configured article/blocks', {
    fromPlugins: [{ name: 'adapt-contrib-trickle', version: '3.0.1' }],
    content: [
      { _type: 'article' },
      { _type: 'block' }
    ]
  });

  testStopWhere('trickle incorrect version', {
    fromPlugins: [{ name: 'adapt-contrib-trickle', version: '4.0.0' }]
  });
});
