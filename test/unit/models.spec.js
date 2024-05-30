import { afterEach, describe, expect, it, jest } from '@jest/globals';
import {
  getModelInheritanceChain,
  getModelConfig,
  getModelContainer,
  _getAncestorNextSiblings,
  getCompletionAttribute,
  isLocked,
  applyLocks,
  addButtonComponents
} from '../../js/models';
import { lookup, setupContent } from '../utils';
import Adapt from 'core/js/adapt';
import data from 'core/js/data';
import components from 'core/js/components';
import ContentObjectModel from 'core/js/models/contentObjectModel';
import MockAdaptModel from '../MockAdaptModel';

jest.mock('core/js/adapt', () => ({
  __esModule: true,
  default: {
    config: {},
    course: {}
  }
}));
jest.mock('core/js/components', () => ({
  __esModule: true,
  default: {
    getModelClass: jest.fn()
  }
}));
jest.mock('core/js/data', () => ({
  __esModule: true,
  default: Object.assign(new globalThis.Backbone.Collection(), { isReady: true })
}));
jest.mock('core/js/logging', () => ({
  __esModule: true,
  default: {} // this is enough to have logTrickleState return early
}));
jest.mock('core/js/models/contentObjectModel', () => {
  const originalModule = jest.requireActual('../MockContentObjectModel');
  return {
    __esModule: true,
    ...originalModule
  };
});
jest.mock('core/js/models/courseModel', () => ({
  __esModule: true,
  default: jest.fn()
}));

describe('getModelInheritanceChain', () => {
  describe('when given an article', () => {
    it('should return only the article in an array', () => {
      const [content] = setupContent([
        ['course', 'm05'],
        ['page', 'co-05'],
        ['article', 'a-05']
      ]);

      const article = lookup(content, 'a-05');

      expect(getModelInheritanceChain(article)).toStrictEqual([article]);
    });
  });

  describe('when given a block', () => {
    it('should return null when trickle is only enabled on the article', () => {
      const [content] = setupContent([
        ['course', 'm05'],
        ['page', 'co-05'],
        ['article', 'a-05', { _trickle: { _isEnabled: true, _onChildren: false } }],
        ['block', 'b-05']
      ]);

      const inheritance = getModelInheritanceChain(lookup(content, 'b-05'));

      expect(inheritance).toBeNull();
    });

    it('should return [block] if it has a trickle configuration', () => {

      const [content] = setupContent([
        ['course', 'm05'],
        ['page', 'co-05'],
        ['article', 'a-05'],
        ['block', 'b-05', { _trickle: { _isEnabled: true } }]
      ]);

      const block = lookup(content, 'b-05');

      expect(getModelInheritanceChain(block)).toStrictEqual([block]);
    });

    it('should return [block, article] if they both have trickle configurations', () => {
      const [content] = setupContent([
        ['course', 'm05'],
        ['page', 'co-05'],
        ['article', 'a-05', { _trickle: { _isEnabled: true } }],
        ['block', 'b-05', { _trickle: { _isEnabled: true } }]
      ]);

      const article = lookup(content, 'a-05');
      const block = lookup(content, 'b-05');

      expect(getModelInheritanceChain(block)).toStrictEqual([block, article]);
    });

    it('should omit the block if it explicitly requires inheritance', () => {
      const [content] = setupContent([
        ['course', 'm05'],
        ['page', 'co-05'],
        ['article', 'a-05', { _trickle: { _isEnabled: true, _onChildren: false } }],
        ['block', 'b-05', { _trickle: { _isEnabled: true, _isInherited: true } }]
      ]);

      const article = lookup(content, 'a-05');
      const block = lookup(content, 'b-05');

      expect(getModelInheritanceChain(block)).toStrictEqual([article]);
    });
  });

  it('should return null for anything that is not a block or article', () => {

    const [content] = setupContent([
      ['course', 'm05', { _trickle: { _isEnabled: true } }],
      ['page', 'co-05', { _trickle: { _isEnabled: true } }],
      ['article', 'a-05'],
      ['block', 'b-05'],
      ['component', 'c-05', { _trickle: { _isEnabled: true } }]
    ]);

    expect(getModelInheritanceChain(lookup(content, 'm05'))).toBeNull();
    expect(getModelInheritanceChain(lookup(content, 'co-05'))).toBeNull();
    expect(getModelInheritanceChain(lookup(content, 'c-05'))).toBeNull();
  });
});

describe('getModelConfig', () => {

  it('should return null if the derived configuration is not explicitly enabled', () => {
    const [content] = setupContent([
      ['course', 'm05'],
      ['page', 'co-05'],
      ['article', 'a-05', { _trickle: { _onChildren: true } }],
      ['block', 'b-05'],
      ['article', 'a-10', { _trickle: { _isEnabled: true } }],
      ['block', 'b-10', { _trickle: { _isEnabled: false } }]
    ]);

    expect(getModelConfig(lookup(content, 'b-05'))).toBeNull();
    expect(getModelConfig(lookup(content, 'b-10'))).toBeNull();
  });

  it('should override inherited configuration with defaults and then own properties', () => {
    const [content] = setupContent([
      ['course', 'm05'],
      ['page', 'co-05'],
      ['article', 'a-05', { _trickle: { _isEnabled: false, _button: { _isEnabled: false } } }],
      ['block', 'b-05', { _trickle: { _isEnabled: true } }],
      ['article', 'a-10', { _trickle: { _isEnabled: false, _scrollDuration: 250 } }],
      ['block', 'b-10', { _trickle: { _isEnabled: true } }]
    ]);

    const b05 = getModelConfig(lookup(content, 'b-05'));
    const b10 = getModelConfig(lookup(content, 'b-10'));

    expect(b05._button._isEnabled).toBeTruthy();
    expect(b05._isEnabled).toBeTruthy();
    expect(b10._scrollDuration).toStrictEqual(250);
  });
});

describe('getModelContainer', () => {

  // TODO: getModelContainer should ignore _onChildren:true on block (per README) but does not

  it('should return the first model in the inheritance chain with _onChildren: true or the first model in the inheritance chain', () => {
    const [content] = setupContent([
      ['course', 'm05'],
      ['page', 'co-05'],
      ['article', 'a-05', { _trickle: { _isEnabled: true } }],
      ['block', 'b-05', { _trickle: { _isEnabled: true } }],
      ['article', 'a-10'],
      ['block', 'b-10', { _trickle: { _isEnabled: true } }],
      ['article', 'a-15', { _trickle: { _isEnabled: true, _onChildren: false } }],
      ['block', 'b-15', { _trickle: { _isEnabled: true, _isInherited: true } }]
    ]);

    expect(getModelContainer(lookup(content, 'b-05'))).toStrictEqual(lookup(content, 'a-05'));
    expect(getModelContainer(lookup(content, 'b-10'))).toStrictEqual(lookup(content, 'b-10'));
    expect(getModelContainer(lookup(content, 'b-15'))).toStrictEqual(lookup(content, 'a-15'));
  });
});

describe('getCompletionAttribute', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('should try the derived configuration then the global configuration then default to _isComplete', () => {
    const [content, config] = setupContent([
      ['course', 'm05'],
      ['page', 'co-05'],
      ['article', 'a-05'],
      ['block', 'b-05', { _trickle: { _isEnabled: true, _completionAttribute: '_isInteractionComplete' } }],
      ['block', 'b-10', { _trickle: { _isEnabled: true } }]
    ]);

    // supply the returned config as trickle will check the global configuration
    jest.replaceProperty(Adapt, 'config', config);

    expect(getCompletionAttribute(lookup(content, 'b-05'))).toStrictEqual('_isInteractionComplete');
    expect(getCompletionAttribute(lookup(content, 'b-10'))).toStrictEqual('_isComplete');

    config.set('_trickle', { _completionAttribute: '_isVisited' });

    expect(getCompletionAttribute(lookup(content, 'b-10'))).toStrictEqual('_isVisited');
  });
});

describe('isLocked', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('should lock until completion or until trickle button has been completed ', () => {
    const [content, config] = setupContent([
      ['course', 'm05'],
      ['page', 'co-05', { __class: ContentObjectModel }], // trickle will do instanceof checks
      ['article', 'a-05'],
      ['block', 'b-00', { _trickle: { _isEnabled: true } }],
      ['block', 'b-05', { _trickle: { _isEnabled: true }, _isOptional: true }],
      ['block', 'b-10', { _trickle: { _isEnabled: true, _stepLocking: { _isEnabled: false } } }],
      ['block', 'b-15', { _trickle: { _isEnabled: true, _stepLocking: { _isCompletionRequired: false } } }]
    ]);

    // supply the returned config as trickle will check the global configuration
    jest.replaceProperty(Adapt, 'config', config);

    class MockTrickleButtonModel extends MockAdaptModel {};

    // mock TrickleButtonModel
    jest.spyOn(components, 'getModelClass').mockImplementation(() => MockTrickleButtonModel);

    const b15 = lookup(content, 'b-15');
    const trickleButton = new MockTrickleButtonModel({ _id: 'trickle-1', _parentId: 'b-15' });

    // add a mock trickle button as a child of b-15
    b15.getChildren().add(trickleButton);

    expect(isLocked(lookup(content, 'b-00'))).toBeTruthy(); // incomplete so locked
    expect(isLocked(lookup(content, 'b-05'))).toBeFalsy(); // optional so not locked
    expect(isLocked(lookup(content, 'b-10'))).toBeFalsy(); // step locking disabled so not locked
    expect(isLocked(lookup(content, 'b-15'))).toBeTruthy(); // trickle button incomplete so locked

    trickleButton.set('_isComplete', true);

    expect(isLocked(lookup(content, 'b-15'))).toBeFalsy(); // trickle button complete so not locked
  });
});

describe('applyLocks', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('should lock content that follows trickled content that is incomplete', () => {
    const [content, config] = setupContent([
      ['course', 'm05'],
      ['page', 'co-05', { __class: ContentObjectModel }],
      ['article', 'a-05', { _trickle: { _isEnabled: true } }],
      ['block', 'b-05'],
      ['article', 'a-10', { _trickle: { _isEnabled: true, _onChildren: false } }],
      ['block', 'b-10'],
      ['article', 'a-15']
    ]);

    // trickle will check Adapt.config and Adapt.course
    jest.replaceProperty(Adapt, 'config', config);
    jest.replaceProperty(Adapt, 'course', lookup(content, 'm05'));

    class MockTrickleButtonModel extends MockAdaptModel {};

    jest.spyOn(components, 'getModelClass').mockImplementation(() => MockTrickleButtonModel);

    applyLocks();

    expect(lookup(content, 'a-05').get('_isLocked')).toBeFalsy();
    expect(lookup(content, 'b-05').get('_isLocked')).toBeFalsy();
    expect(lookup(content, 'a-10').get('_isLocked')).toBeTruthy();
    expect(lookup(content, 'b-10').get('_isLocked')).toBeTruthy();
    expect(lookup(content, 'a-15').get('_isLocked')).toBeTruthy();

    lookup(content, 'a-05').set('_isComplete', true);
    lookup(content, 'b-05').set('_isComplete', true);

    applyLocks();

    expect(lookup(content, 'a-10').get('_isLocked')).toBeFalsy();
    expect(lookup(content, 'b-10').get('_isLocked')).toBeFalsy();
    expect(lookup(content, 'a-15').get('_isLocked')).toBeTruthy();
  });
});

describe('_getAncestorNextSiblings', () => {
  describe('when given a block', () => {
    it('should return the blocks that follow it and the articles that follow its parent', () => {

      const [content] = setupContent([
        ['course', 'm05'],
        ['page', 'co-05', { __class: ContentObjectModel }],
        ['article', 'a-05'],
        ['block', 'b-05'],
        ['block', 'b-10'],
        ['article', 'a-10'],
        ['block', 'b-15']
      ]);

      const b05 = lookup(content, 'b-05');
      const b10 = lookup(content, 'b-10');
      const a10 = lookup(content, 'a-10');
      const siblings = _getAncestorNextSiblings(b05);

      expect(siblings).toHaveLength(2);
      expect(siblings).toContain(b10);
      expect(siblings).toContain(a10);
    });
  });
});

describe('addButtonComponents', () => {
  afterEach(() => {
    jest.restoreAllMocks();
    data.reset();
  });

  it('should append a trickle button once to all content models where trickle is enabled', () => {
    const [content] = setupContent([
      ['course', 'm05'],
      ['page', 'co-05'],
      ['article', 'a-05', { _trickle: { _isEnabled: true } }],
      ['block', 'b-05'],
      ['component', 'c-05'],
      ['block', 'b-10'],
      ['component', 'c-10']
    ]);

    class MockTrickleButtonModel extends MockAdaptModel {
      setupModel() {}
    };

    jest.spyOn(components, 'getModelClass').mockImplementation(() => MockTrickleButtonModel);

    data.add(content);

    const getTrickleButtonChildren = (id) => {
      const model = lookup(content, id);
      return model.getChildren().filter(child => child instanceof MockTrickleButtonModel);
    };

    addButtonComponents();
    addButtonComponents(); // run twice to ensure no duplication

    expect(getTrickleButtonChildren('m05')).toHaveLength(0);
    expect(getTrickleButtonChildren('co-05')).toHaveLength(0);
    expect(getTrickleButtonChildren('a-05')).toHaveLength(0);
    expect(getTrickleButtonChildren('b-05')).toHaveLength(1);
    expect(getTrickleButtonChildren('c-05')).toHaveLength(0);
    expect(getTrickleButtonChildren('b-10')).toHaveLength(1);
    expect(getTrickleButtonChildren('c-10')).toHaveLength(0);
  });
});
