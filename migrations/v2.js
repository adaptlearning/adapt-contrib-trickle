import { describe, getConfig, whereContent, whereFromPlugin, mutateContent, checkContent, updatePlugin } from 'adapt-migrations';
import _ from 'lodash';

describe('Trickle - v2.1.1 to v2.1.2', async () => {
  // https://github.com/adaptlearning/adapt-contrib-trickle/compare/v2.1.1..v2.1.2

  let configuredBlocks, configuredArticles;

  whereFromPlugin('Trickle - from v2.1.1', { name: 'adapt-contrib-trickle', version: '<2.1.2' });

  whereContent('Trickle is configured', content => {
    configuredBlocks = content.filter(({ _type, _trickle }) => _trickle && _type === 'block');
    configuredArticles = content.filter(({ _type, _trickle }) => _trickle && _type === 'article');
    return configuredBlocks.length || configuredArticles.length;
  });

  mutateContent('Trickle - add block attribute startText', async (content) => {
    configuredBlocks.forEach(block => {
      if (!_.has(block._trickle, '_button')) _.set(block._trickle, '_button', {});
      block._trickle._button.startText = 'Begin';
    });

    return true;
  });

  mutateContent('Trickle - add block attribute finalText', async (content) => {
    configuredBlocks.forEach(block => {
      if (!_.has(block._trickle, '_button')) _.set(block._trickle, '_button', {});
      block._trickle._button.finalText = 'Finish';
    });

    return true;
  });

  mutateContent('Trickle - add article attribute startText', async (content) => {
    configuredArticles.forEach(article => {
      if (!_.has(article._trickle, '_button')) _.set(article._trickle, '_button', {});
      article._trickle._button.startText = 'Begin';
    });

    return true;
  });

  checkContent('Trickle - check block attribute startText', async (content) => {
    const isValid = configuredBlocks.every(block => block._trickle._button.startText === 'Begin');

    if (!isValid) throw new Error('Trickle - block attribute startText');

    return true;
  });

  checkContent('Trickle - check block attribute finalText', async (content) => {
    const isValid = configuredBlocks.every(block => block._trickle._button.finalText === 'Finish');

    if (!isValid) throw new Error('Trickle - block attribute finalText');

    return true;
  });

  checkContent('Trickle - check article attribute startText', async (content) => {
    const isValid = configuredArticles.every(article => article._trickle._button.startText === 'Begin');

    if (!isValid) throw new Error('Trickle - article attribute startText');

    return true;
  });

  updatePlugin('Trickle - update to v2.1.2', { name: 'adapt-contrib-trickle', version: '2.1.2', framework: '">=2.0.6' });
});

describe('Trickle - v2.1.3 to v2.1.5', async () => {
  // https://github.com/adaptlearning/adapt-contrib-trickle/compare/v2.1.3..v2.1.5

  let config, configuredBlocks, configuredArticles;

  whereFromPlugin('Trickle - from v2.1.3', { name: 'adapt-contrib-trickle', version: '<2.1.5' });

  whereContent('Trickle is configured', content => {
    config = getConfig(content);
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
      if (article._trickle._button?._isFullWidth !== 'true') return;
      article._trickle._button._isFullWidth = true;
    });

    return true;
  });

  mutateContent('Trickle - update article attribute _button._autoHide', async (content) => {
    configuredArticles.forEach(article => {
      if (article._trickle._button?._autoHide !== 'true') return;
      article._trickle._button._autoHide = true;
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
      if (_.has(block._trickle, '_button._isEnabled')) return;
      block._trickle._button._isEnabled = true;
    });

    return true;
  });

  mutateContent('Trickle - update block attribute _button._isFullWidth', async (content) => {
    configuredBlocks.forEach(block => {
      if (block._trickle._button?._isFullWidth !== 'true') return;
      block._trickle._button._isFullWidth = true;
    });

    return true;
  });

  mutateContent('Trickle - update block attribute _button._autoHide', async (content) => {
    configuredBlocks.forEach(block => {
      if (block._trickle._button?._autoHide !== 'true') return;
      block._trickle._button._autoHide = true;
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

  updatePlugin('Trickle - update to v2.1.5', { name: 'adapt-contrib-trickle', version: '2.1.5', framework: '">=2.2' });
});

describe('Trickle - v2.1.5 to v2.2.0', async () => {
  // https://github.com/adaptlearning/adapt-contrib-trickle/compare/v2.1.5..v2.2.0

  let course, courseTrickleGlobals;
  const incompleteContent = 'There is incomplete content above. You must complete this before you can proceed through the course.';

  whereFromPlugin('Trickle - from v2.1.5', { name: 'adapt-contrib-trickle', version: '<2.2.0' });

  whereContent('Trickle is configured', content => {
    course = content.find(({ _type }) => _type === 'course');
    return getConfig(content)._trickle;
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

  updatePlugin('Trickle - update to v2.2.0', { name: 'adapt-contrib-trickle', version: '2.2.0', framework: '">=2.2' });
});
