import { afterEach, beforeEach, describe, expect, it, jest } from '@jest/globals';
import TrickleButtonModel from '../../js/TrickleButtonModel';
import controller from '../../js/controller';
import models from '../../js/models';
import { lookup, setupContent } from '../utils';

jest.mock('../../js/controller', () => {
  const mocks = {
    get isKilled() { return false; }
  };
  return { __esModule: true, default: mocks, ...mocks };
});

jest.mock('../../js/models', () => {
  const mocks = {
    getModelContainer: jest.fn(),
    getModelConfig: jest.fn(),
    getCompletionAttribute: jest.fn(),
    applyLocks: jest.fn()
  };
  return { __esModule: true, default: mocks, ...mocks };
});

describe('calculateButtonState', () => {
  let content;

  beforeEach(() => {
    [content] = setupContent([
      ['course', 'm05'],
      ['page', 'co-05'],
      ['article', 'a-05'],

      ['block', 'b-05', {
        _trickle: {
          _isEnabled: true,
          _button: { _isEnabled: true, _styleBeforeCompletion: 'hidden', _styleAfterClick: 'hidden' },
          _stepLocking: { _isEnabled: true, _isCompletionRequired: true }
        },
        _isComplete: true
      }],
      ['component', 'c-05', { _isComplete: true }],
      ['component', 'trickle-1', {
        __class: TrickleButtonModel, _component: 'trickle-button', _isComplete: true
      }],

      ['block', 'b-10', {
        _trickle: {
          _isEnabled: true,
          _button: { _isEnabled: true, _styleBeforeCompletion: 'hidden', _styleAfterClick: 'hidden' },
          _stepLocking: { _isEnabled: true, _isCompletionRequired: true }
        }
      }],
      ['component', 'c-05', { _isComplete: true }],
      ['component', 'trickle-2', {
        __class: TrickleButtonModel, _component: 'trickle-button'
      }],

      ['block', 'b-15', {
        _trickle: {
          _isEnabled: true,
          _button: { _isEnabled: true, _styleBeforeCompletion: 'visible', _styleAfterClick: 'hidden' },
          _stepLocking: { _isEnabled: true, _isCompletionRequired: true }
        }
      }],
      ['component', 'c-05', { _isComplete: false }],
      ['component', 'trickle-3', {
        __class: TrickleButtonModel, _component: 'trickle-button'
      }]
    ]);

    jest.spyOn(models, 'getModelConfig').mockImplementation(m => lookup(content, m.get('_id')).get('_trickle'));
    jest.spyOn(models, 'getCompletionAttribute').mockReturnValue('_isComplete');
    jest.spyOn(models, 'getModelContainer').mockImplementation(m => m.getParent());
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('should calculate the current button visible and enabled states', () => {
    const btn1 = lookup(content, 'trickle-1');
    const btn2 = lookup(content, 'trickle-2');
    const btn3 = lookup(content, 'trickle-3');

    btn1.calculateButtonState(); // button has been clicked
    btn2.calculateButtonState(); // button can be clicked
    btn3.calculateButtonState(); // button visible but cannot be clicked yet

    expect(btn1.attributes).toMatchObject({ _isButtonVisible: false, _isButtonDisabled: false });
    expect(btn2.attributes).toMatchObject({ _isButtonVisible: true, _isButtonDisabled: false });
    expect(btn3.attributes).toMatchObject({ _isButtonVisible: true, _isButtonDisabled: true });

  });
});
