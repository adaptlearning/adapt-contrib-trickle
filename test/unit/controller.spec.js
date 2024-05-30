import { afterEach, beforeEach, describe, expect, it, jest } from '@jest/globals';
import Controller from '../../js/controller';
import { lookup, setupContent } from '../utils';
import Adapt from 'core/js/adapt';
import data from 'core/js/data';
import components from 'core/js/components';
import MockAdaptModel from '../MockAdaptModel';

jest.mock('../../js/models', () => {
  const mocks = {
    checkApplyLocks: jest.fn(),
    addButtonComponents: jest.fn(),
    applyLocks: jest.fn(),
    debouncedApplyLocks: jest.fn(),
    getModelConfig: jest.fn(),
    isModelArticleWithOnChildren: jest.fn()
  };
  return { __esModule: true, default: mocks, ...mocks };
});

jest.mock('core/js/adapt', () => ({
  __esModule: true,
  default: Object.assign({
    config: {},
    course: {},
    parentView: {}
  }, globalThis.Backbone.Events)
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
jest.mock('core/js/wait', () => ({
  __esModule: true,
  default: {}
}));
jest.mock('core/js/a11y', () => ({
  __esModule: true,
  default: {}
}));
jest.mock('core/js/router', () => ({
  __esModule: true,
  default: {}
}));

describe('isTrickling', () => {
  let content;

  beforeEach(() => {
    class MockTrickleButtonModel extends MockAdaptModel {};
    jest.spyOn(components, 'getModelClass').mockImplementation(() => MockTrickleButtonModel);

    [content] = setupContent([
      ['course', 'm05'],
      ['page', 'co-05'],
      ['article', 'a-05'],
      ['block', 'b-05', { _isTrickled: true, _isLocked: false }],
      ['component', 'trickle-1', { __class: MockTrickleButtonModel, _component: 'trickle-button', _isLocked: true }],
      ['block', 'b-10', { _isTrickled: true, _isLocked: true }],
      ['component', 'trickle-2', { __class: MockTrickleButtonModel, _component: 'trickle-button', _isLocked: true }]
    ]);

    jest.replaceProperty(Adapt, 'course', lookup(content, 'm05'));
    jest.replaceProperty(Adapt, 'parentView', { model: lookup(content, 'co-05') });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('should return true if the current page is locked by trickle', () => {
    expect(Controller.isTrickling).toBeTruthy();

    lookup(content, 'trickle-1').set({ _isComplete: true });

    expect(Controller.isTrickling).toBeTruthy();

    lookup(content, 'b-10').set('_isLocked', false);

    expect(Controller.isTrickling).toBeFalsy();

    lookup(content, 'a-05').set({ _requireCompletionOf: Number.POSITIVE_INFINITY, _canRequestChild: true });

    expect(Controller.isTrickling).toBeTruthy();
  });
});

describe('kill', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('should turn off all trickle locking, continue rendering and set the page model state as killed', () => {
    class MockTrickleButtonModel extends MockAdaptModel {
      setCompletionStatus = jest.fn();
    };

    jest.spyOn(components, 'getModelClass').mockImplementation(() => MockTrickleButtonModel);

    const [content] = setupContent([
      ['course', 'm05'],
      ['page', 'co-05'],
      ['article', 'a-05'],
      ['block', 'b-05', { _isTrickled: true, _isLocked: false }],
      ['component', 'trickle-1', { __class: MockTrickleButtonModel, _component: 'trickle-button', _isLocked: true }],
      ['block', 'b-10', { _isTrickled: true, _isLocked: true }],
      ['component', 'trickle-2', { __class: MockTrickleButtonModel, _component: 'trickle-button', _isLocked: true }],
      ['block', 'b-15', { _isLocked: true }]
    ]);

    jest.replaceProperty(Adapt, 'course', lookup(content, 'm05'));
    jest.replaceProperty(Adapt, 'parentView', { model: lookup(content, 'co-05') });
    jest.spyOn(Controller, 'continue').mockImplementation(jest.fn());

    Controller.kill();

    content.forEach(i => {
      if (i instanceof MockTrickleButtonModel === false) return;

      expect(i.setCompletionStatus).toHaveBeenCalled();
    });

    expect(content.filter(i => i.get('_isTrickled')).every(i => !i.get('_isLocked'))).toBeTruthy();
    expect(lookup(content, 'b-15').get('_isLocked')).toBeTruthy();
    expect(Controller.continue).toHaveBeenCalled();
    expect(Controller.isKilled).toBeTruthy();
  });
});
