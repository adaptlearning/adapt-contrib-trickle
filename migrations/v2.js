import { describe, whereContent, whereFromPlugin, mutateContent, checkContent, updatePlugin } from 'adapt-migrations';

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

  updatePlugin('Trickle - update to v2.1.2', { name: 'adapt-contrib-pageLevelProgress', version: '2.1.2', framework: '">=2.0.6' });
});

// _completionAttribute "_isInteractionComplete" -> "_isComplete"
// _isFullWidth "true" -> true
// _autoHide "true" -> true
