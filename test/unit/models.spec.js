import { afterEach, beforeEach, describe, expect, it, jest } from '@jest/globals';
import { getModelInheritanceChain, getModelConfig, getModelContainer } from '../../js/models';

jest.mock('core/js/adapt', () => ({
  __esModule: true
}));
jest.mock('core/js/components', () => ({
  __esModule: true
}));
jest.mock('core/js/data', () => ({
  __esModule: true,
  default: { isReady: true }
}));
jest.mock('core/js/logging', () => ({
  __esModule: true
}));
jest.mock('core/js/models/contentObjectModel', () => ({
  __esModule: true
}));
jest.mock('core/js/models/courseModel', () => ({
  __esModule: true
}));

class MockModel extends Backbone.Model {
  getParent() { return this.get('_parent'); }
}

describe('getModelInheritanceChain', () => {
  describe('when given an article', () => {
    it('should return only the article in an array', () => {
      const article = new MockModel({ _type: 'article' });

      expect(getModelInheritanceChain(article)).toStrictEqual([article]);
    });
  });

  describe('when given a block', () => {
    it('should return null when trickle is only enabled on the article', () => {
      const article = new MockModel({
        _type: 'article',
        _trickle: { _isEnabled: true, _onChildren: false }
      });
      const block = new MockModel({ _type: 'block', _parent: article });

      const inheritance = getModelInheritanceChain(block);

      expect(inheritance).toBeNull();
    });

    it('should return [block] if it has a trickle configuration', () => {
      const article = new MockModel({
        _type: 'article'
      });
      const block = new MockModel({
        _type: 'block',
        _parent: article,
        _trickle: { _isEnabled: true }
      });

      expect(getModelInheritanceChain(block)).toStrictEqual([block]);
    });

    it('should return [block, article] if they both have trickle configurations', () => {
      const article = new MockModel({
        _type: 'article',
        _trickle: { _isEnabled: true, _onChildren: false }
      });
      const block = new MockModel({
        _type: 'block',
        _parent: article,
        _trickle: { _isEnabled: true }
      });

      expect(getModelInheritanceChain(block)).toStrictEqual([block, article]);
    });

    it('should omit the block if it explicitly requires inheritance', () => {
      const article = new MockModel({
        _type: 'article',
        _trickle: { _isEnabled: true, _onChildren: false }
      });
      const block = new MockModel({
        _type: 'block',
        _parent: article,
        _trickle: { _isEnabled: true, _isInherited: true }
      });

      expect(getModelInheritanceChain(block)).toStrictEqual([article]);
    });
  });
});

describe('getModelConfig', () => {

  it('should return null if trickle is not enabled via the model or via inheritance', () => {
    const article = new MockModel({
      _type: 'article',
      _trickle: { _isEnabled: false, _onChildren: true }
    });
    const block = new MockModel({
      _type: 'block',
      _parent: article
    });

    const config = getModelConfig(block);

    expect(config).toBeNull();
  });

  it('should return null if the derived configuration is not enabled', () => {
    const article = new MockModel({
      _type: 'article',
      _trickle: { _isEnabled: true }
    });
    const block = new MockModel({
      _type: 'block',
      _parent: article,
      _trickle: { _isEnabled: false }
    });

    const config = getModelConfig(block);

    expect(config).toBeNull();
  });

  describe('when given a block', () => {

    it('should override inherited configuration with defaults and then own properties', () => {
      const article = new MockModel({
        _type: 'article',
        _trickle: { _isEnabled: false, _button: { _isEnabled: false } }
      });
      const block = new MockModel({
        _type: 'block',
        _parent: article,
        _trickle: { _isEnabled: true }
      });

      const config = getModelConfig(block);

      expect(config._button._isEnabled).toBeTruthy();
      expect(config._isEnabled).toBeTruthy();
    });

    it('should inherit configuration from the article ', () => {
      const article = new MockModel({
        _type: 'article',
        _trickle: { _isEnabled: false, _scrollDuration: 250 }
      });
      const block = new MockModel({
        _type: 'block',
        _parent: article,
        _trickle: { _isEnabled: true }
      });

      const config = getModelConfig(block);
      expect(config._scrollDuration).toStrictEqual(250);
    });
  });
});

describe('getModelContainer', () => {

  // TODO: getModelContainer should ignore _onChildren:true on block (per README) but does not

  it('should identify the article as the container when given a block', () => {
    const article = new MockModel({
      _type: 'article',
      _trickle: { _isEnabled: true } // _onChildren is inferred by getModelConfigDefaults
    });
    const block = new MockModel({
      _type: 'block',
      _parent: article,
      _trickle: { _isEnabled: true }
    });

    const config = getModelContainer(block);

    expect(config).toStrictEqual(article);
  });
});
