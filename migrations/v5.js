import { describe, whereContent, whereFromPlugin, mutateContent, checkContent, updatePlugin, testStopWhere, testSuccessWhere } from 'adapt-migrations';
import _ from 'lodash';

describe('Trickle - v4.0.6 to v5.0.0', async () => {
  // https://github.com/adaptlearning/adapt-contrib-trickle/compare/v4.0.6..v5.0.0

  let configuredBlocks, configuredArticles;
  const ariaLabel = 'Continue';
  const startAriaLabel = 'Begin';
  const finalAriaLabel = 'Finish';

  whereFromPlugin('Trickle - from v4.0.6', { name: 'adapt-contrib-trickle', version: '<5.0.0' });

  whereContent('Trickle is configured', content => {
    configuredBlocks = content.filter(({ _type, _trickle }) => _trickle && _type === 'block');
    configuredArticles = content.filter(({ _type, _trickle }) => _trickle && _type === 'article');
    return configuredBlocks.length || configuredArticles.length;
  });

  mutateContent('Trickle - add article attribute ariaLabel', async (content) => {
    configuredArticles.forEach(article => {
      if (!_.has(article._trickle, '_button')) _.set(article._trickle, '_button', {});
      article._trickle._button.ariaLabel = ariaLabel;
    });
    return true;
  });

  mutateContent('Trickle - add article attribute startAriaLabel', async (content) => {
    configuredArticles.forEach(article => {
      if (!_.has(article._trickle, '_button')) _.set(article._trickle, '_button', {});
      article._trickle._button.startAriaLabel = startAriaLabel;
    });
    return true;
  });

  mutateContent('Trickle - add article attribute finalAriaLabel', async (content) => {
    configuredArticles.forEach(article => {
      if (!_.has(article._trickle, '_button')) _.set(article._trickle, '_button', {});
      article._trickle._button.finalAriaLabel = finalAriaLabel;
    });
    return true;
  });

  mutateContent('Trickle - add block attribute ariaLabel', async (content) => {
    configuredBlocks.forEach(block => {
      if (!_.has(block._trickle, '_button')) _.set(block._trickle, '_button', {});
      block._trickle._button.ariaLabel = ariaLabel;
    });
    return true;
  });

  mutateContent('Trickle - add block attribute startAriaLabel', async (content) => {
    configuredBlocks.forEach(block => {
      if (!_.has(block._trickle, '_button')) _.set(block._trickle, '_button', {});
      block._trickle._button.startAriaLabel = startAriaLabel;
    });
    return true;
  });

  mutateContent('Trickle - add block attribute finalAriaLabel', async (content) => {
    configuredBlocks.forEach(block => {
      if (!_.has(block._trickle, '_button')) _.set(block._trickle, '_button', {});
      block._trickle._button.finalAriaLabel = finalAriaLabel;
    });
    return true;
  });

  mutateContent('Trickle - add block attribute _isInherited', async (content) => {
    configuredBlocks.forEach(block => {
      if (!_.has(block._trickle, '_button')) _.set(block._trickle, '_button', {});
      block._trickle._button._isInherited = false;
    });
    return true;
  });

  checkContent('Trickle - check article attribute ariaLabel', async (content) => {
    const isValid = configuredArticles.every(article => article._trickle._button.ariaLabel === ariaLabel);
    if (!isValid) throw new Error('Trickle - article attribute ariaLabel');
    return true;
  });

  checkContent('Trickle - check article attribute startAriaLabel', async (content) => {
    const isValid = configuredArticles.every(article => article._trickle._button.startAriaLabel === startAriaLabel);
    if (!isValid) throw new Error('Trickle - article attribute startAriaLabel');
    return true;
  });

  checkContent('Trickle - check article attribute finalAriaLabel', async (content) => {
    const isValid = configuredArticles.every(article => article._trickle._button.finalAriaLabel === finalAriaLabel);
    if (!isValid) throw new Error('Trickle - article attribute finalAriaLabel');
    return true;
  });

  checkContent('Trickle - check block attribute ariaLabel', async (content) => {
    const isValid = configuredBlocks.every(block => block._trickle._button.ariaLabel === ariaLabel);
    if (!isValid) throw new Error('Trickle - block attribute ariaLabel');
    return true;
  });

  checkContent('Trickle - check block attribute startAriaLabel', async (content) => {
    const isValid = configuredBlocks.every(block => block._trickle._button.startAriaLabel === startAriaLabel);
    if (!isValid) throw new Error('Trickle - block attribute startAriaLabel');
    return true;
  });

  checkContent('Trickle - check block attribute finalAriaLabel', async (content) => {
    const isValid = configuredBlocks.every(block => block._trickle._button.finalAriaLabel === finalAriaLabel);
    if (!isValid) throw new Error('Trickle - block attribute finalAriaLabel');
    return true;
  });

  checkContent('Trickle - check block attribute _isInherited', async (content) => {
    const isValid = configuredBlocks.every(block => block._trickle._button._isInherited === false);
    if (!isValid) throw new Error('Trickle - block attribute _isInherited');
    return true;
  });

  updatePlugin('Trickle - update to v5.0.0', { name: 'adapt-contrib-trickle', version: '5.0.0', framework: '>=5.8' });

  testSuccessWhere('trickle with both configured/non configured articles/blocks and empty/no article/block._trickle._button', {
    fromPlugins: [{ name: 'adapt-contrib-trickle', version: '4.0.6' }],
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
    fromPlugins: [{ name: 'adapt-contrib-trickle', version: '5.0.0' }]
  });
});

describe('Trickle - v5.0.0 to v5.1.0', async () => {
  // https://github.com/adaptlearning/adapt-contrib-trickle/compare/v5.0.0..v5.1.0

  let configuredArticles;

  whereFromPlugin('Trickle - from v5.0.0', { name: 'adapt-contrib-trickle', version: '<5.1.0' });

  whereContent('Trickle is configured', content => {
    configuredArticles = content.filter(({ _type, _trickle }) => _trickle && _type === 'article');
    return configuredArticles.length;
  });

  mutateContent('Trickle - add article attribute _showEndOfPage', async (content) => {
    configuredArticles.forEach(article => {
      if (!_.has(article._trickle, '_button')) _.set(article._trickle, '_button', {});
      article._trickle._button._showEndOfPage = true;
    });
    return true;
  });

  checkContent('Trickle - check article attribute _showEndOfPage', async (content) => {
    const isValid = configuredArticles.every(article => article._trickle._button._showEndOfPage === true);
    if (!isValid) throw new Error('Trickle - article attribute _showEndOfPage');
    return true;
  });

  updatePlugin('Trickle - update to v5.1.0', { name: 'adapt-contrib-trickle', version: '5.1.0', framework: '>=5.0.0' });

  testSuccessWhere('trickle with both configured/non configured articles and empty/no article._trickle._button', {
    fromPlugins: [{ name: 'adapt-contrib-trickle', version: '5.0.0' }],
    content: [
      { _type: 'article', _trickle: { _button: {} } },
      { _type: 'article', _trickle: {} },
      { _type: 'article' },
      { _type: 'config', _trickle: {} }
    ]
  });

  testStopWhere('trickle with no configured articles', {
    fromPlugins: [{ name: 'adapt-contrib-trickle', version: '5.0.0' }],
    content: [
      { _type: 'article' },
      { _type: 'article' }
    ]
  });

  testStopWhere('trickle incorrect version', {
    fromPlugins: [{ name: 'adapt-contrib-trickle', version: '5.1.0' }]
  });
});

describe('Trickle - v5.1.0 to v5.1.1', async () => {
  // https://github.com/adaptlearning/adapt-contrib-trickle/compare/v5.1.0..v5.1.1

  let configuredBlocks;

  whereFromPlugin('Trickle - from v5.1.0', { name: 'adapt-contrib-trickle', version: '<5.1.1' });

  whereContent('Trickle is configured', content => {
    configuredBlocks = content.filter(({ _type, _trickle }) => _trickle && _type === 'block');
    return configuredBlocks.length;
  });

  mutateContent('Trickle - add block attribute _showEndOfPage', async (content) => {
    configuredBlocks.forEach(block => {
      if (!_.has(block._trickle, '_button')) _.set(block._trickle, '_button', {});
      block._trickle._button._showEndOfPage = true;
    });
    return true;
  });

  checkContent('Trickle - check block attribute _showEndOfPage', async (content) => {
    const isValid = configuredBlocks.every(block => block._trickle._button._showEndOfPage === true);
    if (!isValid) throw new Error('Trickle - block attribute _showEndOfPage');
    return true;
  });

  updatePlugin('Trickle - update to v5.1.1', { name: 'adapt-contrib-trickle', version: '5.1.1', framework: '>=5.0.0' });

  testSuccessWhere('trickle with both configured/non configured articles and empty/no article._trickle._button', {
    fromPlugins: [{ name: 'adapt-contrib-trickle', version: '5.1.0' }],
    content: [
      { _type: 'block', _trickle: { _button: {} } },
      { _type: 'block', _trickle: {} },
      { _type: 'block' },
      { _type: 'config', _trickle: {} }
    ]
  });

  testStopWhere('trickle with no configured article/blocks', {
    fromPlugins: [{ name: 'adapt-contrib-trickle', version: '5.1.0' }],
    content: [
      { _type: 'article' },
      { _type: 'block' }
    ]
  });

  testStopWhere('trickle incorrect version', {
    fromPlugins: [{ name: 'adapt-contrib-trickle', version: '5.1.1' }]
  });
});
