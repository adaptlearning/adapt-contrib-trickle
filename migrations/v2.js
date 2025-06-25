import { describe, getConfig, getCourse, whereContent, whereFromPlugin, mutateContent, checkContent, updatePlugin, testStopWhere, testSuccessWhere } from 'adapt-migrations';
import _ from 'lodash';

describe('Trickle - v2.1.1 to v2.1.2', async () => {
  // https://github.com/adaptlearning/adapt-contrib-trickle/compare/v2.1.1..v2.1.2

  let configuredBlocks, configuredArticles;
  const newStartText = 'Begin';
  const newFinalText = 'Finish';

  whereFromPlugin('Trickle - from v2.1.1', { name: 'adapt-contrib-trickle', version: '>=2.0.0 <2.1.2' });

  whereContent('Trickle is configured', content => {
    configuredBlocks = content.filter(({ _type, _trickle }) => _trickle && _type === 'block');
    configuredArticles = content.filter(({ _type, _trickle }) => _trickle && _type === 'article');
    return configuredBlocks.length || configuredArticles.length;
  });

  mutateContent('Trickle - add block attribute startText', async (content) => {
    configuredBlocks.forEach(block => {
      if (!_.has(block._trickle, '_button')) _.set(block._trickle, '_button', {});
      block._trickle._button.startText = newStartText;
    });
    return true;
  });

  mutateContent('Trickle - add block attribute finalText', async (content) => {
    configuredBlocks.forEach(block => {
      if (!_.has(block._trickle, '_button')) _.set(block._trickle, '_button', {});
      block._trickle._button.finalText = newFinalText;
    });
    return true;
  });

  mutateContent('Trickle - add article attribute startText', async (content) => {
    configuredArticles.forEach(article => {
      if (!_.has(article._trickle, '_button')) _.set(article._trickle, '_button', {});
      article._trickle._button.startText = newStartText;
    });
    return true;
  });

  checkContent('Trickle - check block attribute startText', async (content) => {
    const isValid = configuredBlocks.every(block => block._trickle._button.startText === newStartText);
    if (!isValid) throw new Error('Trickle - block attribute startText');
    return true;
  });

  checkContent('Trickle - check block attribute finalText', async (content) => {
    const isValid = configuredBlocks.every(block => block._trickle._button.finalText === newFinalText);
    if (!isValid) throw new Error('Trickle - block attribute finalText');
    return true;
  });

  checkContent('Trickle - check article attribute startText', async (content) => {
    const isValid = configuredArticles.every(article => article._trickle._button.startText === newStartText);
    if (!isValid) throw new Error('Trickle - article attribute startText');
    return true;
  });

  updatePlugin('Trickle - update to v2.1.2', { name: 'adapt-contrib-trickle', version: '2.1.2', framework: '>=2.0.6' });

  testSuccessWhere('trickle with both configured/non configured articles/blocks', {
    fromPlugins: [{ name: 'adapt-contrib-trickle', version: '2.1.1' }],
    content: [
      { _type: 'article', _trickle: { _button: {} } },
      { _type: 'article', _trickle: {} },
      { _type: 'article' },
      { _type: 'block', _trickle: { _button: {} } },
      { _type: 'block', _trickle: {} },
      { _type: 'block' }
    ]
  });

  testStopWhere('trickle no configured articles/blocks', {
    fromPlugins: [{ name: 'adapt-contrib-trickle', version: '2.1.1' }],
    content: [
      { _type: 'course' }
    ]
  });

  testStopWhere('trickle incorrect version', {
    fromPlugins: [{ name: 'adapt-contrib-trickle', version: '2.1.2' }]
  });
});

describe('Trickle - v2.1.3 to v2.1.5', async () => {
  // https://github.com/adaptlearning/adapt-contrib-trickle/compare/v2.1.3..v2.1.5

  let config, configuredBlocks, configuredArticles;

  const stringToBoolean = (str, defaultValue) => {
    if (typeof str !== 'string') return defaultValue;
    return str.toLowerCase() === 'true';
  };

  whereFromPlugin('Trickle - from v2.1.3', { name: 'adapt-contrib-trickle', version: '<2.1.5' });

  whereContent('Trickle is configured', content => {
    config = getConfig();
    configuredBlocks = content.filter(({ _type, _trickle }) => _trickle && _type === 'block');
    configuredArticles = content.filter(({ _type, _trickle }) => _trickle && _type === 'article');
    return config._trickle || configuredBlocks.length || configuredArticles.length;
  });

  mutateContent('Trickle - update config attribute _completionAttribute', async (content) => {
    if (config?._completionAttribute === '_isInteractionComplete') {
      config._completionAttribute = '_isComplete';
    }
    return true;
  });

  mutateContent('Trickle - update article attribute _button._isFullWidth', async (content) => {
    configuredArticles.forEach(article => {
      if (!article._trickle._button?._isFullWidth) return;
      article._trickle._button._isFullWidth = stringToBoolean(article._trickle._button._isFullWidth, true);
    });
    return true;
  });

  mutateContent('Trickle - update article attribute _button._autoHide', async (content) => {
    configuredArticles.forEach(article => {
      if (!article._trickle._button?._autoHide) return;
      article._trickle._button._autoHide = stringToBoolean(article._trickle._button._autoHide, true);
    });
    return true;
  });

  mutateContent('Trickle - update block attribute _isEnabled', async (content) => {
    configuredBlocks.forEach(block => {
      if (_.has(block._trickle, '_isEnabled')) return;
      block._trickle._isEnabled = true;
    });
    return true;
  });

  mutateContent('Trickle - update block attribute _button._isEnabled', async (content) => {
    configuredBlocks.forEach(block => {
      const blockButton = block._trickle._button;
      if (blockButton?._isEnabled || !blockButton) return;
      block._trickle._button._isEnabled = true;
    });
    return true;
  });

  mutateContent('Trickle - update block attribute _button._isFullWidth', async (content) => {
    configuredBlocks.forEach(block => {
      if (!block._trickle._button?._isFullWidth) return;
      block._trickle._button._isFullWidth = stringToBoolean(block._trickle._button._isFullWidth, true);
    });
    return true;
  });

  mutateContent('Trickle - update block attribute _button._autoHide', async (content) => {
    configuredBlocks.forEach(block => {
      if (!block._trickle._button?._autoHide) return;
      block._trickle._button._autoHide = stringToBoolean(block._trickle._button._autoHide, true);
    });
    return true;
  });

  checkContent('Trickle - check config attribute _completionAttribute', async (content) => {
    const isValid = config?._completionAttribute !== '_isInteractionComplete';
    if (!isValid) throw new Error('Trickle - config attribute _completionAttribute');
    return true;
  });

  checkContent('Trickle - check article attribute _button._isFullWidth', async (content) => {
    const isValid = configuredArticles.every(({ _trickle }) => !_.has(_trickle, '_button') || _trickle._button._isFullWidth !== 'true');
    if (!isValid) throw new Error('Trickle - article attribute _button._isFullWidth');
    return true;
  });

  checkContent('Trickle - check article attribute _button._autoHide', async (content) => {
    const isValid = configuredArticles.every(({ _trickle }) => !_.has(_trickle, '_button') || _trickle._button._autoHide !== 'true');
    if (!isValid) throw new Error('Trickle - article attribute _button._autoHide');
    return true;
  });

  checkContent('Trickle - check block attribute _isEnabled', async (content) => {
    const isValid = configuredBlocks.every(block => _.has(block._trickle, '_isEnabled'));
    if (!isValid) throw new Error('Trickle - block attribute _isEnabled');
    return true;
  });

  checkContent('Trickle - check block attribute _button._isEnabled', async (content) => {
    const isValid = configuredBlocks.every(({ _trickle }) => !_.has(_trickle, '_button') || _.has(_trickle._button, '_isEnabled'));
    if (!isValid) throw new Error('Trickle - block attribute _button._isEnabled');
    return true;
  });

  checkContent('Trickle - check block attribute _button._isFullWidth', async (content) => {
    const isValid = configuredBlocks.every(({ _trickle }) => !_.has(_trickle, '_button') || _trickle._button._isFullWidth !== 'true');
    if (!isValid) throw new Error('Trickle - block attribute _button._isFullWidth');
    return true;
  });

  checkContent('Trickle - check block attribute _button._autoHide', async (content) => {
    const isValid = configuredBlocks.every(({ _trickle }) => !_.has(_trickle, '_button') || _trickle._button._autoHide !== 'true');
    if (!isValid) throw new Error('Trickle - block attribute _button._autoHide');
    return true;
  });

  updatePlugin('Trickle - update to v2.1.5', { name: 'adapt-contrib-trickle', version: '2.1.5', framework: '>=2.2.0' });

  testSuccessWhere('trickle with both configured/non configured articles/blocks and empty article/block/config._trickle', {
    fromPlugins: [{ name: 'adapt-contrib-trickle', version: '2.1.3' }],
    content: [
      { _type: 'article', _trickle: {} },
      { _type: 'article', _trickle: { _button: {} } },
      { _type: 'article' },
      { _type: 'block', _trickle: {} },
      { _type: 'block', _trickle: { _button: {} } },
      { _type: 'block' },
      { _type: 'config', _trickle: {} }
    ]
  });

  testSuccessWhere('trickle with both configured/non configured articles/blocks and defaults', {
    fromPlugins: [{ name: 'adapt-contrib-trickle', version: '2.1.3' }],
    content: [
      { _type: 'article', _trickle: { _button: { _isFullWidth: true } } },
      { _type: 'article', _trickle: { _button: { _isFullWidth: 'true' } } },
      { _type: 'article', _trickle: { _button: { _isFullWidth: 'false' } } },
      { _type: 'article' },
      { _type: 'block', _trickle: { _button: { _isEnabled: true, _isFullWidth: 'true', _autoHide: 'true' } } },
      { _type: 'block', _trickle: { _button: { _isEnabled: true, _isFullWidth: 'false', _autoHide: 'false' } } },
      { _type: 'block' },
      { _type: 'config', _trickle: { _completionAttribute: '_isInteractionComplete', _button: {} } }
    ]
  });

  testStopWhere('trickle no configured articles/blocks and empty config', {
    fromPlugins: [{ name: 'adapt-contrib-trickle', version: '2.1.3' }],
    content: [
      { _type: 'course' },
      { _type: 'article' },
      { _type: 'block' },
      { _type: 'config' }
    ]
  });

  testStopWhere('trickle incorrect version', {
    fromPlugins: [{ name: 'adapt-contrib-trickle', version: '2.1.5' }]
  });
});

describe('Trickle - v2.1.5 to v2.2.0', async () => {
  // https://github.com/adaptlearning/adapt-contrib-trickle/compare/v2.1.5..v2.2.0

  let course, courseTrickleGlobals;
  const incompleteContent = 'There is incomplete content above. You must complete this before you can proceed through the course.';

  whereFromPlugin('Trickle - from v2.1.5', { name: 'adapt-contrib-trickle', version: '<2.2.0' });

  whereContent('Trickle is configured', content => {
    course = getCourse();
    return getConfig()._trickle;
  });

  mutateContent('Trickle - add globals if missing', async (content) => {
    if (!_.has(course, '_globals._extensions._trickle')) _.set(course, '_globals._extensions._trickle', {});
    courseTrickleGlobals = course._globals._extensions._trickle;
    return true;
  });

  mutateContent('Trickle - global attribute incompleteContent', async (content) => {
    courseTrickleGlobals.incompleteContent = incompleteContent;
    return true;
  });

  checkContent('Trickle - check global attribute incompleteContent', async (content) => {
    const isValid = course._globals._extensions._trickle.incompleteContent === incompleteContent;
    if (!isValid) throw new Error('Trickle - global attribute incompleteContent');
    return true;
  });

  updatePlugin('Trickle - update to v2.2.0', { name: 'adapt-contrib-trickle', version: '2.2.0', framework: '>=2.2.0' });

  testSuccessWhere('trickle with config._trickle and empty course', {
    fromPlugins: [{ name: 'adapt-contrib-trickle', version: '2.1.5' }],
    content: [
      { _type: 'config', _trickle: {} },
      { _type: 'course' }
    ]
  });

  testSuccessWhere('trickle with config._trickle and course with globals', {
    fromPlugins: [{ name: 'adapt-contrib-trickle', version: '2.1.5' }],
    content: [
      { _type: 'config', _trickle: {} },
      { _type: 'course', _globals: { _extensions: { _trickle: {} } } }
    ]
  });

  testStopWhere('trickle with empty course and config', {
    fromPlugins: [{ name: 'adapt-contrib-trickle', version: '2.1.5' }],
    content: [
      { _type: 'course' },
      { _type: 'config' }
    ]
  });

  testStopWhere('trickle incorrect version', {
    fromPlugins: [{ name: 'adapt-contrib-trickle', version: '2.2.0' }]
  });
});
