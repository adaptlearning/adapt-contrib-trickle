import { describe, whereContent, whereFromPlugin, mutateContent, checkContent, updatePlugin } from 'adapt-migrations';
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

  updatePlugin('Trickle - update to v7.2.0', { name: 'adapt-contrib-trickle', version: '7.2.0', framework: '">=5.31.24' });
});
