import Adapt from 'core/js/adapt';
import components from 'core/js/components';
import data from 'core/js/data';
import logging from 'core/js/logging';
import ContentObjectModel from 'core/js/models/contentObjectModel';
import CourseModel from 'core/js/models/courseModel';

/**
 * Utility function for applying deep defaults
 * @param {Object} original
 * @param  {...Object} defaultObjects
 * @returns {Object} Returns original
 */
export function _deepDefaults(original, ...defaultObjects) {
  defaultObjects.reverse();
  defaultObjects.forEach(defaults => {
    const keyValuePairs = Object.entries(defaults);
    keyValuePairs.forEach(([ key, defaultValue ]) => {
      const isRecursiveObject = (typeof defaultValue === 'object' && !Array.isArray(defaultValue) && defaultValue !== null);
      if (isRecursiveObject) {
        original[key] = _deepDefaults(original[key] || {}, defaultValue);
        return;
      }
      const isValueAlreadySet = Object.prototype.hasOwnProperty.call(original, key);
      if (isValueAlreadySet) return;
      original[key] = defaultValue;
    });
  });
  return original;
}

export const configDefaults = {
  _isEnabled: false,
  _isInherited: false,
  _autoScroll: true,
  _scrollTo: '@block +1',
  _onChildren: false,
  _button: {
    _isEnabled: true,
    _isFullWidth: true,
    _autoHide: false,
    _hasIcon: false,
    _styleBeforeCompletion: 'hidden',
    _styleAfterClick: 'hidden',
    _component: 'trickle-button',
    _className: '',
    text: 'Continue',
    ariaLabel: '',
    startText: '',
    startAriaLabel: '',
    finalText: '',
    finalAriaLabel: ''
  },
  _stepLocking: {
    _isEnabled: true,
    _isCompletionRequired: true,
    _isLockedOnRevisit: false
  }
};

/**
 * @param {Backbone.Model} model
 * @returns {Boolean}
 */
export function isModelArticleWithOnChildren(model) {
  const type = model.get('_type');
  const trickleConfig = model.get('_trickle');
  return (type === 'article' && trickleConfig?._onChildren !== false);
}

/**
 * @param {Backbone.Model} model
 * @returns {Boolean}
 */
export function isModelBlockWithArticleNotChildren(model) {
  const type = model.get('_type');
  const parentTrickleConfig = model.getParent()?.get('_trickle');
  return (type === 'block' && parentTrickleConfig?._isEnabled === true && parentTrickleConfig?._onChildren === false);
}

/**
 * Get the default trickle configuration for the given model
 * @param {Backbone.Model} model
 */
export function getModelConfigDefaults(model) {
  const type = model.get('_type');
  const config = {};
  // Setup default legacy article behaviour, onChildren === isArticle if omitted
  _deepDefaults(config, configDefaults, {
    _onChildren: (type === 'article')
  });
  // Default startText and finalText when _onChildren: true
  if (config._onChildren) {
    config._button.startText = config._button.startText ?? 'Begin';
    config._button.startAriaLabel = config._button.startAriaLabel ?? '';
    config._button.finalText = config._button.finalText ?? 'Finish';
    config._button.finalAriaLabel = config._button.finalAriaLabel ?? '';
  }
  // Force step locking for _isFullWidth buttons
  if (config._button._isFullWidth) {
    config._stepLocking._isEnabled = true;
  }
  return config;
}

/**
 * Returns an array of models from which to derive a trickle config or null
 * @param {Backbone.Model} configModel
 * @returns {[Backbone.Model]|null}
 */
export function getModelInheritanceChain(configModel) {
  if (!data.isReady) throw new Error('Trickle cannot resolve inheritance chains until data is ready');
  const type = configModel.get('_type');
  if (type === 'block') {
    const parentModel = configModel.getParent();
    const parentConfig = parentModel.get('_trickle');
    const blockConfig = configModel.get('_trickle');
    const isParentEnabledNotOnChildren = (parentConfig?._isEnabled && parentConfig._onChildren === false);
    const isNoChildConfig = (!blockConfig?._isEnabled);
    if (isParentEnabledNotOnChildren && isNoChildConfig) {
      return null;
    }
    return [ configModel, parentModel ].filter(ancestor => {
      const config = ancestor.get('_trickle');
      // Remove models with no config and models which explicitly require inheritance
      return (config && !config._isInherited);
    });
  }
  if (type === 'article') {
    return [ configModel ];
  }
  return null;
};

/**
 * Returns the derived trickle configuration for the given model
 * @param {Backbone.Model} model
 * @returns {Object}
 */
export function getModelConfig(model) {
  const inheritance = getModelInheritanceChain(model);
  if (!inheritance?.length || isModelArticleWithOnChildren(model) || isModelBlockWithArticleNotChildren(model)) return null;
  const config = $.extend(true, {}, ...inheritance.reverse().map((inheritModel, index, arr) => {
    const isLast = (index === arr.length - 1);
    const defaults = isLast ? getModelConfigDefaults(inheritModel) : null;
    return $.extend(true, {}, defaults, inheritModel.get('_trickle'));
  }));
  if (!config._isEnabled) return null;
  return config;
}

/**
 * Returns the first model in the inheritance chain with `_onChildren: true`.
 * If no model found, return the first inheritance model (should match the param model but inheritance checks the `_trickle` config).
 * @param {Backbone.Model} model
 * @returns {Backbone.Model}
 */
export function getModelContainer(model) {
  const inheritance = getModelInheritanceChain(model);
  return inheritance?.find(inheritModel => {
    const defaults = getModelConfigDefaults(inheritModel);
    const config = $.extend(true, {}, defaults, inheritModel.get('_trickle'));
    return config._onChildren;
  }) ?? inheritance?.[0];
}

/**
 * Fetch the defined or default completion attribute on which trickle should
 * listen for completion
 * @return {string}
 */
export function getCompletionAttribute(model = null) {
  return getModelConfig(model)?._completionAttribute || Adapt.config.get('_trickle')?._completionAttribute || '_isComplete';
}

/**
 * Reapply trickle locks if the completion attribute has changed on the given model
 * @param {Backbone.Model} model
 */
export function checkApplyLocks(model) {
  if (!data.isReady) return;
  const completionAttribute = getCompletionAttribute(model);
  const hasCompletionChanged = Object.prototype.hasOwnProperty.call(model.changed, completionAttribute);
  const hasAvailabilityChanged = Object.prototype.hasOwnProperty.call(model.changed, '_isAvailable');
  if (!hasCompletionChanged && !hasAvailabilityChanged) return;
  // Apply the locks lazily
  debouncedApplyLocks();
}

/**
 * Calculates and applies the new locking state for each sub-page model according
 * to each trickle configuration
 */
export function applyLocks() {
  if (!data.isReady) return;
  const locks = {};
  const modelsById = {};
  // Fetch the component model from the store incase it needs overriding by another extension
  const TrickleButtonModel = components.getModelClass('trickle-button');
  const setDescendantLocks = ((model, id) => {
    model.getAllDescendantModels().forEach(descendant => {
      const descendantId = descendant.get('_id');
      modelsById[descendantId] = descendant;
      locks[descendantId] = locks[id];
    });
  });
  // Check all models for trickle potential
  Adapt.course.getAllDescendantModels(true).filter(model => model.get('_isAvailable')).forEach(siteModel => {
    const trickleConfig = getModelConfig(siteModel);
    if (!isEnabled(siteModel, { trickleConfig })) return;
    const isModelLocked = isLocked(siteModel, { trickleConfig });
    const id = siteModel.get('_id');
    modelsById[id] = siteModel;
    locks[id] = locks[id] || false;
    if (!locks[id]) setDescendantLocks(siteModel, id);
    // Apply lock to all subsequent models
    const subsequentLockingModels = _getAncestorNextSiblings(siteModel);
    subsequentLockingModels.forEach((model, index) => {
      const id = model.get('_id');
      const isButtonModel = (model instanceof TrickleButtonModel);
      const isTrickled = model.get('_isTrickled');
      // Do not stop at TrickleButtonModels
      if (isTrickled !== isButtonModel) model.set('_isTrickled', !isButtonModel);
      // Store the new locking state of each model in the locks variable
      // Don't unlock anything that was locked in a previous group
      modelsById[id] = model;
      locks[id] = locks[id] || isModelLocked;
      // Don't modify the children if they are managed by another locking mechanism
      if (model.get('_lockType')) return;
      // Cascade inherited locks through the hierarchy
      setDescendantLocks(model, id);
    });
  });
  // Apply only changed locking states
  Object.entries(locks).forEach(([ id, isModelLocked ]) => {
    const model = modelsById[id];
    const wasLocked = model.get('_isLocked');
    if (wasLocked === isModelLocked) return;
    model.set('_isLocked', isModelLocked);
  });
  logTrickleState();
}

export function isEnabled(model, { trickleConfig = getModelConfig(model) } = {}) {
  return (trickleConfig?._isEnabled === true);
}

export function isLocked(model, { trickleConfig = getModelConfig(model) } = {}) {
  const isStepLocked = Boolean(trickleConfig?._stepLocking?._isEnabled);
  if (!isStepLocked) return false;
  const isCompletionRequired = Boolean(trickleConfig?._stepLocking?._isCompletionRequired);
  const completionAttribute = getCompletionAttribute(model);
  if (!isCompletionRequired) {
    const TrickleModel = components.getModelClass('trickle-button');
    const trickleButton = model.getAvailableChildModels().find(model => model instanceof TrickleModel);
    const isTrickleButtonComplete = Boolean(trickleButton?.get(completionAttribute));
    return !isTrickleButtonComplete;
  }
  const isModelLocked = !model?.get(completionAttribute) &&
    !model?.get('_isOptional');
  return isModelLocked;
}

export const debouncedApplyLocks = _.debounce(applyLocks, 1);

/**
 * Returns all of the contentobject descendant models directly subsequent to the
 * given model through each ancestor
 * If fromModel is a block; its block next siblings and article next siblings
 * @param {Backbone.Model} child
 * @returns {Array<Backbone.Model>}
 */
export function _getAncestorNextSiblings(fromModel) {
  if (!fromModel) return [];
  // Fetch all subsequent siblings
  const allSiblings = fromModel.getParent().getAvailableChildModels();
  const subsequentSiblings = allSiblings.slice(allSiblings.findIndex(sibling => sibling === fromModel) + 1);
  // Fetch all ancestors between the page and the child
  const allAncestors = fromModel.getAncestorModels();
  const inPageAncestors = allAncestors.slice(0, allAncestors.findIndex(parent => parent instanceof ContentObjectModel) + 1);
  // Move from the next ancestor down as we already have the parent's children (fromModel siblings)
  // Collect all subsequent in-page ancestor siblings
  const subsequentInPageAncestors = [];
  inPageAncestors.slice(1).forEach((grandParent, previousIndex) => {
    const parent = inPageAncestors[previousIndex];
    const allGrandParentChildren = grandParent.getAvailableChildModels();
    const subsequentAncestorSiblings = allGrandParentChildren.slice(allGrandParentChildren.findIndex(child => child === parent) + 1);
    subsequentInPageAncestors.push(...subsequentAncestorSiblings);
  });
  // Combine and return entire set
  const subsequentContentObjectDescendantModels = subsequentSiblings.concat(subsequentInPageAncestors);
  return subsequentContentObjectDescendantModels;
}

/**
 * Adds trickle button components in their relevant places throughout the course
 */
export function addButtonComponents() {
  // Fetch the component model from the store incase it needs overriding by another extension
  const TrickleButtonModel = components.getModelClass('trickle-button');
  let uid = 0;
  data.forEach(buttonModelSite => {
    if (buttonModelSite instanceof CourseModel) return;
    const trickleConfig = getModelConfig(buttonModelSite);
    if (!trickleConfig || !trickleConfig?._isEnabled || buttonModelSite.get('_isTrickleSiteConfigured')) return;
    buttonModelSite.set('_isTrickleSiteConfigured', true);
    const parentId = buttonModelSite.get('_id');
    const trickleButtonModel = new TrickleButtonModel({
      _id: `trickle-${uid++}`,
      _type: 'component',
      _component: 'trickle-button',
      _parentId: parentId,
      _isAvailable: true,
      _layout: 'full',
      _trickle: { _isEnabled: true },
      _renderPosition: 'outer-append',
      _isTrackable: false
    });
    trickleButtonModel.setupModel();
    // This line would usually append a trickle button to an article or block
    buttonModelSite.getChildren().add(trickleButtonModel);
    // Add trickle button to data collection
    data.add(trickleButtonModel);
  });
}

/**
 * Pretty print locking state for current page
 */
export function logTrickleState() {
  const trickleConfig = Adapt.config.get('_trickle');
  if (!trickleConfig?._logState || logging._config?._level !== 'debug') return;
  if (!Adapt.parentView?.model?.isTypeGroup('page')) {
    logging.debug('TRICKLE GLOBAL STATE');
    Adapt.course.getAllDescendantModels(true).filter(model => model.get('_isAvailable')).forEach(model => {
      const isLocked = model.get('_isLocked');
      const isTrickled = model.get('_isTrickled');
      logging.debug(`${' '.repeat(model.getAncestorModels().length)}${model.get('_type')} ${model.get('_id')} isLocked: ${isLocked} isTrickled: ${isTrickled}`);
    });
    return;
  }
  logging.debug('TRICKLE STATE');
  Adapt.parentView.model.getAllDescendantModels(true).filter(model => model.get('_isAvailable')).forEach(model => {
    const isLocked = model.get('_isLocked');
    const isTrickled = model.get('_isTrickled');
    logging.debug(`${' '.repeat(model.getAncestorModels().length)}${model.get('_type')} ${model.get('_id')} isLocked: ${isLocked} isTrickled: ${isTrickled}`);
  });
}

/**
 * Utility functions for trickle model operations
 */
export default {
  _deepDefaults,
  configDefaults,
  getModelConfigDefaults,
  getModelInheritanceChain,
  getModelConfig,
  getModelContainer,
  getCompletionAttribute,
  checkApplyLocks,
  applyLocks,
  debouncedApplyLocks,
  _getAncestorNextSiblings,
  addButtonComponents,
  logTrickleState
};
