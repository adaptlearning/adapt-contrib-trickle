import { describe, whereContent, whereFromPlugin, mutateContent, checkContent, updatePlugin, testStopWhere, testSuccessWhere, getConfig } from 'adapt-migrations';
import _ from 'lodash';

describe('Trickle - v7.1.3 to v7.2.0', async () => {
  // https://github.com/adaptlearning/adapt-contrib-trickle/compare/v7.1.3..v7.2.0

  let configuredBlocks, configuredArticles;
  const disabledText = '';
  const disabledAriaLabel = '';

  whereFromPlugin('Trickle - from v7.1.3', { name: 'adapt-contrib-trickle', version: '<7.2.0' });

  whereContent('Trickle is configured', content => {
    configuredBlocks = content.filter(({ _type, _trickle }) => _trickle && _type === 'block');
    configuredArticles = content.filter(({ _type, _trickle }) => _trickle && _type === 'article');
    return configuredBlocks.length || configuredArticles.length;
  });

  mutateContent('Trickle - add article attribute disabledText', async (content) => {
    configuredArticles.forEach(article => {
      if (!_.has(article._trickle, '_button')) _.set(article._trickle, '_button', {});
      article._trickle._button.disabledText = disabledText;
    });
    return true;
  });

  mutateContent('Trickle - add article attribute disabledAriaLabel', async (content) => {
    configuredArticles.forEach(article => {
      if (!_.has(article._trickle, '_button')) _.set(article._trickle, '_button', {});
      article._trickle._button.disabledAriaLabel = disabledAriaLabel;
    });
    return true;
  });

  mutateContent('Trickle - add block attribute disabledText', async (content) => {
    configuredBlocks.forEach(block => {
      if (!_.has(block._trickle, '_button')) _.set(block._trickle, '_button', {});
      block._trickle._button.disabledText = disabledText;
    });
    return true;
  });

  mutateContent('Trickle - add block attribute disabledAriaLabel', async (content) => {
    configuredBlocks.forEach(block => {
      if (!_.has(block._trickle, '_button')) _.set(block._trickle, '_button', {});
      block._trickle._button.disabledAriaLabel = disabledAriaLabel;
    });
    return true;
  });

  checkContent('Trickle - check article attribute disabledText', async (content) => {
    const isValid = configuredArticles.every(article => article._trickle._button.disabledText === disabledText);
    if (!isValid) throw new Error('Trickle - article attribute disabledText');
    return true;
  });

  checkContent('Trickle - check article attribute disabledAriaLabel', async (content) => {
    const isValid = configuredArticles.every(article => article._trickle._button.disabledAriaLabel === disabledAriaLabel);
    if (!isValid) throw new Error('Trickle - article attribute disabledAriaLabel');
    return true;
  });

  checkContent('Trickle - check block attribute disabledText', async (content) => {
    const isValid = configuredBlocks.every(block => block._trickle._button.disabledText === disabledText);
    if (!isValid) throw new Error('Trickle - block attribute disabledText');
    return true;
  });

  checkContent('Trickle - check block attribute disabledAriaLabel', async (content) => {
    const isValid = configuredBlocks.every(block => block._trickle._button.disabledAriaLabel === disabledAriaLabel);
    if (!isValid) throw new Error('Trickle - block attribute disabledAriaLabel');
    return true;
  });

  updatePlugin('Trickle - update to v7.2.0', { name: 'adapt-contrib-trickle', version: '7.2.0', framework: '>=5.31.24' });

  testSuccessWhere('trickle with both configured/non configured articles/blocks and empty/no article/block._trickle._button', {
    fromPlugins: [{ name: 'adapt-contrib-trickle', version: '7.1.3' }],
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
    fromPlugins: [{ name: 'adapt-contrib-trickle', version: '7.1.3' }],
    content: [
      { _type: 'article' },
      { _type: 'block' }
    ]
  });

  testStopWhere('trickle incorrect version', {
    fromPlugins: [{ name: 'adapt-contrib-trickle', version: '7.2.0' }]
  });
});

describe('Trickle - v7.5.0 to v7.5.1', async () => {
  // https://github.com/adaptlearning/adapt-contrib-trickle/compare/v7.5.0..v7.5.1

  let config;

  whereFromPlugin('Trickle - from v7.5.0', { name: 'adapt-contrib-trickle', version: '<7.5.1' });

  whereContent('Trickle is configured', content => {
    config = getConfig();
    return config._trickle;
  });

  mutateContent('Trickle - add config attribute _isEnabled', async (content) => {
    if (!_.has(config._trickle, '_isEnabled')) config._trickle._isEnabled = true;
    return true;
  });

  checkContent('Trickle - check config attribute _isEnabled', async (content) => {
    const isValid = _.has(config._trickle, '_isEnabled');
    if (!isValid) throw new Error('Trickle - config attribute _isEnabled');
    return true;
  });

  updatePlugin('Trickle - update to v7.5.1', { name: 'adapt-contrib-trickle', version: '7.5.1', framework: '">=5.19.1' });

  testSuccessWhere('trickle with empty course._trickle', {
    fromPlugins: [{ name: 'adapt-contrib-trickle', version: '7.5.0' }],
    content: [
      { _type: 'config', _trickle: {} }
    ]
  });

  testStopWhere('trickle with empty config', {
    fromPlugins: [{ name: 'adapt-contrib-trickle', version: '7.5.0' }],
    content: [
      { _type: 'article' },
      { _type: 'block' },
      { _type: 'config' }
    ]
  });

  testStopWhere('trickle incorrect version', {
    fromPlugins: [{ name: 'adapt-contrib-trickle', version: '7.5.1' }]
  });
});
