import { describe, whereContent, whereFromPlugin, mutateContent, checkContent, updatePlugin } from 'adapt-migrations';
import _ from 'lodash';

describe('Trickle - v2.2.1 to v3.0.0', async () => {
  // https://github.com/adaptlearning/adapt-contrib-trickle/compare/v2.2.1..v3.0.0

  let configuredBlocks, configuredArticles;

  whereFromPlugin('Trickle - from v2.2.1', { name: 'adapt-contrib-trickle', version: '<3.0.0' });

  whereContent('Trickle is configured', content => {
    configuredBlocks = content.filter(({ _type, _trickle }) => _trickle && _type === 'block');
    configuredArticles = content.filter(({ _type, _trickle }) => _trickle && _type === 'article');
    return configuredBlocks.length || configuredArticles.length;
  });

  mutateContent('Trickle - update article attribute _scrollDuration', async (content) => {
    configuredArticles.forEach(article => {
      // convert any string representing a finite number to type Number otherwise leave as-is
      const scrollDuration = _.toNumber(article._trickle._scrollDuration);
      if (!_.isFinite(scrollDuration)) return;
      article._trickle._scrollDuration = scrollDuration;
    });

    return true;
  });

  mutateContent('Trickle - update block attribute _scrollDuration', async (content) => {
    configuredBlocks.forEach(block => {
      // convert any string representing a finite number to type Number otherwise leave as-is
      const scrollDuration = _.toNumber(block._trickle._scrollDuration);
      if (!_.isFinite(scrollDuration)) return;
      block._trickle._scrollDuration = scrollDuration;
    });

    return true;
  });

  checkContent('Trickle - check article attribute _scrollDuration', async (content) => {
    const isValid = configuredArticles.every(({ _trickle }) => {
      const scrollDuration = _.toNumber(_trickle._scrollDuration);
      return !_.isFinite(scrollDuration) || _trickle._scrollDuration === scrollDuration;
    });

    if (!isValid) throw new Error('Trickle - article attribute _scrollDuration');

    return true;
  });

  checkContent('Trickle - check block attribute _scrollDuration', async (content) => {
    const isValid = configuredBlocks.every(({ _trickle }) => {
      const scrollDuration = _.toNumber(_trickle._scrollDuration);
      return !_.isFinite(scrollDuration) || _trickle._scrollDuration === scrollDuration;
    });

    if (!isValid) throw new Error('Trickle - block attribute _scrollDuration');

    return true;
  });

  updatePlugin('Trickle - update to v3.0.0', { name: 'adapt-contrib-trickle', version: '3.0.0', framework: '">=3' });
});
