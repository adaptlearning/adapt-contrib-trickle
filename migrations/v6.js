import { describe, whereContent, whereFromPlugin, mutateContent, checkContent, updatePlugin, getConfig, testStopWhere, testSuccessWhere } from 'adapt-migrations';
import _ from 'lodash';

describe('Trickle - v6.0.0 to v6.1.0', async () => {
  // https://github.com/adaptlearning/adapt-contrib-trickle/compare/v6.0.0..v6.1.0

  let configuredBlocks, configuredArticles;

  whereFromPlugin('Trickle - from v6.0.0', { name: 'adapt-contrib-trickle', version: '<6.1.0' });

  whereContent('Trickle is configured', content => {
    configuredBlocks = content.filter(({ _type, _trickle }) => _trickle && _type === 'block');
    configuredArticles = content.filter(({ _type, _trickle }) => _trickle && _type === 'article');
    return configuredBlocks.length || configuredArticles.length;
  });

  mutateContent('Trickle - add article attribute _completionAttribute', async (content) => {
    configuredArticles.forEach(article => {
      if (!_.has(article._trickle, '_button')) _.set(article._trickle, '_button', {});
      article._trickle._button._completionAttribute = '_isComplete';
    });
    return true;
  });

  mutateContent('Trickle - add block attribute _completionAttribute', async (content) => {
    configuredBlocks.forEach(block => {
      if (!_.has(block._trickle, '_button')) _.set(block._trickle, '_button', {});
      block._trickle._button._completionAttribute = '_isComplete';
    });
    return true;
  });

  checkContent('Trickle - check article attribute _completionAttribute', async (content) => {
    const isValid = configuredArticles.every(article => article._trickle._button._completionAttribute === '_isComplete');
    if (!isValid) throw new Error('Trickle - article attribute _completionAttribute');
    return true;
  });

  checkContent('Trickle - check block attribute _completionAttribute', async (content) => {
    const isValid = configuredBlocks.every(block => block._trickle._button._completionAttribute === '_isComplete');
    if (!isValid) throw new Error('Trickle - block attribute _completionAttribute');
    return true;
  });

  updatePlugin('Trickle - update to v6.1.0', { name: 'adapt-contrib-trickle', version: '6.1.0', framework: '>=5.19.1' });

  testSuccessWhere('trickle with both configured/non configured articles/blocks and empty/no article/block._trickle._button', {
    fromPlugins: [{ name: 'adapt-contrib-trickle', version: '6.0.0' }],
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
    fromPlugins: [{ name: 'adapt-contrib-trickle', version: '6.0.0' }],
    content: [
      { _type: 'article' },
      { _type: 'block' }
    ]
  });

  testStopWhere('trickle incorrect version', {
    fromPlugins: [{ name: 'adapt-contrib-trickle', version: '6.1.0' }]
  });
});

describe('Trickle - v6.1.1 to v6.2.0', async () => {
  // https://github.com/adaptlearning/adapt-contrib-trickle/compare/v6.1.1..v6.2.0

  let config;

  whereFromPlugin('Trickle - from v6.1.1', { name: 'adapt-contrib-trickle', version: '<6.2.0' });

  whereContent('Trickle is configured', content => {
    config = getConfig();
    return config._trickle;
  });

  mutateContent('Trickle - add config attribute _isEnabled', async (content) => {
    config._trickle._isEnabled = true;
    return true;
  });

  checkContent('Trickle - check config attribute _isEnabled', async (content) => {
    const isValid = config._trickle._isEnabled === true;
    if (!isValid) throw new Error('Trickle - config attribute _isEnabled');
    return true;
  });

  updatePlugin('Trickle - update to v6.2.0', { name: 'adapt-contrib-trickle', version: '6.2.0', framework: '>=5.19.1' });

  testSuccessWhere('trickle with config._trickle', {
    fromPlugins: [{ name: 'adapt-contrib-trickle', version: '6.1.0' }],
    content: [
      { _type: 'config', _trickle: {} }
    ]
  });

  testStopWhere('trickle with empty config', {
    fromPlugins: [{ name: 'adapt-contrib-trickle', version: '6.1.0' }],
    content: [
      { _type: 'config' }
    ]
  });

  testStopWhere('trickle incorrect version', {
    fromPlugins: [{ name: 'adapt-contrib-trickle', version: '6.2.0' }]
  });
});

describe('Trickle - v6.3.4 to v6.3.5', async () => {
  // https://github.com/adaptlearning/adapt-contrib-trickle/compare/v6.3.4..v6.3.5

  let config;

  whereFromPlugin('Trickle - from v6.3.4', { name: 'adapt-contrib-trickle', version: '<6.3.5' });

  whereContent('Trickle is configured', content => {
    config = getConfig();
    return config._trickle;
  });

  mutateContent('Trickle - add config attribute _logState', async (content) => {
    config._trickle._logState = false;
    return true;
  });

  checkContent('Trickle - check config attribute _logState', async (content) => {
    const isValid = config._trickle._logState === false;
    if (!isValid) throw new Error('Trickle - config attribute _logState');
    return true;
  });

  updatePlugin('Trickle - update to v6.3.5', { name: 'adapt-contrib-trickle', version: '6.3.5', framework: '>=5.19.1' });

  testSuccessWhere('trickle with config._trickle', {
    fromPlugins: [{ name: 'adapt-contrib-trickle', version: '6.3.4' }],
    content: [
      { _type: 'config', _trickle: {} }
    ]
  });

  testStopWhere('trickle with empty config', {
    fromPlugins: [{ name: 'adapt-contrib-trickle', version: '6.3.4' }],
    content: [
      { _type: 'config' }
    ]
  });

  testStopWhere('trickle incorrect version', {
    fromPlugins: [{ name: 'adapt-contrib-trickle', version: '6.3.5' }]
  });
});
