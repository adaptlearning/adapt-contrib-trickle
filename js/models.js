import Adapt from 'core/js/adapt';
import data from 'core/js/data';
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
      const isValueAlreadySet = original.hasOwnProperty(key);
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
 * Returns true if the model is the root of its trickle configuration
 * @param {Backbone.Model} model
 * @returns {Boolean}
 */
export function isModelSite(model) {
  const models = getModelInheritanceChain(model);
  return (models?.length === 1 && models[0] === model && models[0].get('_trickle')?._isEnabled);
}

/**
 * Get the default trickle configuration for the given model
 * @param {Backbone.Model} model
 */
export function getModelConfigDefaults(model) {
  const config = {};
  // Setup default legacy article behaviour, onChildren === isArticle if omitted
  const isArticle = (model.get('_type') === 'article');
  _deepDefaults(config, configDefaults, {
    _onChildren: isArticle
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
  switch (configModel.get('_type')) {
    case 'article':
      return [ configModel ];
    case 'block':
      if (!data.isReady) return [ configModel ];
      return [ configModel, configModel.getParent() ].filter(ancestor => {
        const config = ancestor.get('_trickle');
        // Remove models with no config and models which explicitly require inheritance
        return (config && !config._isInherited);
      });
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
  if (!inheritance?.length) return null;
  const config = $.extend(true, {}, ...inheritance.reverse().map((inheritModel, index, arr) => {
    const isLast = (index === arr.length - 1);
    const defaults = isLast ? getModelConfigDefaults(inheritModel) : null;
    return $.extend(true, {}, defaults, inheritModel.get('_trickle'));
  }));
  return config;
}

/**
 * Returns the first model in the inheritance chain with _onChildren: true
 * @param {Backbone.Model} model
 * @returns {Backbone.Model}
 */
export function getModelContainer(model) {
  const inheritance = getModelInheritanceChain(model);
  return inheritance?.find(inheritModel => {
    const defaults = getModelConfigDefaults(inheritModel);
    const config = $.extend(true, {}, defaults, inheritModel.get('_trickle'));
    return config._onChildren;
  });
}

/**
 * Fetch the defined or default completion attribute on which trickle should
 * listen for completion
 * @return {string}
 */
export function getCompletionAttribute() {
  return Adapt.config.get('_trickle')?._completionAttribute || '_isComplete';
}

/**
 * Reapply trickle locks if the completion attribute has changed on the given model
 * @param {Backbone.Model} model
 */
export function checkApplyLocks(model) {
  const completionAttribute = getCompletionAttribute();
  if (!model.changed.hasOwnProperty(completionAttribute)) return;
  applyLocks();
}

/**
 * Calculates and applies the new locking state for each sub-page model according
 * to each trickle configuration
 */
export function applyLocks() {
  if (!data.isReady) return;
  const completionAttribute = getCompletionAttribute();
  const locks = {};
  const modelsById = {};
  // Fetch the component model from the store incase it needs overriding by another extension
  const TrickleButtonModel = Adapt.getModelClass('trickle-button');
  // Fetch all configured sites
  const siteModels = Adapt.course.getAllDescendantModels(true).filter(model => isModelSite(model));
  siteModels.forEach(siteModel => {
    const trickleConfig = getModelConfig(siteModel);
    // Do no process disabled sites
    if (!trickleConfig?._isEnabled) return;
    const isStepLocked = trickleConfig &&
      trickleConfig._stepLocking &&
      trickleConfig._stepLocking._isEnabled;
    // Capture all subsequent models whose locking is directly impacted by this site
    const selfAndSubsequentLockingModels = _getSelfAndAncestorNextSiblings(
      trickleConfig._onChildren
        ? siteModel.getAvailableChildModels()[0]
        : siteModel
    );
    selfAndSubsequentLockingModels.forEach((model, index) => {
      const previousModel = selfAndSubsequentLockingModels[index - 1];
      const id = model.get('_id');
      const isButtonModel = (model instanceof TrickleButtonModel);
      // Do not stop at TrickleButtonModels
      model.set('_isTrickled', !isButtonModel);
      const isFirst = (index === 0);
      // Do not force lock the first model in each site
      const isLocked = !isFirst &&
        isStepLocked &&
        !previousModel?.get(completionAttribute) &&
        !previousModel?.get('_isOptional');
      // Attempt to lock subsequent models
      modelsById[id] = model;
      // Store the new locking state of each model in the locks variable
      // Don't unlock anything that was locked in a previous group
      locks[id] = locks[id] || isLocked;
      // Cascade inherited locks through the hierarchy of each subsequent parent
      model.getAllDescendantModels().forEach(descendant => {
        const descendantId = descendant.get('_id');
        modelsById[descendantId] = descendant;
        locks[descendantId] = locks[id];
      });
    });
  });
  // Apply only changed locking states
  Object.entries(locks).forEach(([ id, isLocked ]) => {
    const model = modelsById[id];
    const wasLocked = model.get('_isLocked');
    if (wasLocked === isLocked) return;
    model.set('_isLocked', isLocked);
  });
}

/**
 * Returns all of the contentobject descendant models directly subsequent to the
 * given model through each ancestor
 * If fromModel is a component; its next sibling components, next block siblings
 * and next article siblings will be returned
 * @param {Backbone.Model} child
 * @returns {Array<Backbone.Model>}
 */
export function _getSelfAndAncestorNextSiblings(fromModel) {
  if (!fromModel) return [];
  // Fetch all subsequent siblings
  const allSiblings = fromModel.getParent().getAvailableChildModels();
  const selfAndSubsequentSiblings = allSiblings.slice(allSiblings.findIndex(sibling => sibling === fromModel));
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
  const selfAndSubsequentContentObjectDescendantModels = selfAndSubsequentSiblings.concat(subsequentInPageAncestors);
  return selfAndSubsequentContentObjectDescendantModels;
}

/**
 * Adds trickle button components in their relevant places throughout the course
 */
export function addComponents() {
  // Fetch the component model from the store incase it needs overriding by another extension
  const TrickleModel = Adapt.getModelClass('trickle-button');
  let uid = 0;
  data.forEach(siteModel => {
    if (siteModel instanceof CourseModel) return;
    let trickleConfig = getModelConfig(siteModel);
    if (!trickleConfig?._isEnabled) return;
    // Add a trickle button component model to each trickle site where applicable
    const buttonModelSites = trickleConfig._onChildren ? siteModel.getChildren().models : [siteModel];
    buttonModelSites.forEach(buttonModelSite => {
      if (buttonModelSite.get('_isTrickleSiteConfigured')) return;
      buttonModelSite.set('_isTrickleSiteConfigured', true);
      const parentId = buttonModelSite.get('_id');
      const trickleModel = new TrickleModel({
        _id: `trickle-${uid++}`,
        _type: 'component',
        _component: 'trickle-button',
        _parentId: parentId,
        _isAvailable: true,
        _layout: 'full',
        _trickle: { _isEnabled: true },
        _renderPosition: 'outer-append'
      });
      trickleModel.setupModel();
      // This line would usually append a trickle button to an article or block
      buttonModelSite.getChildren().add(trickleModel);
    });
  });
}

/**
 * Pretty print locking state for current page
 */
export function log() {
  if (!Adapt.parentView?.model?.isTypeGroup('page')) return;
  Adapt.parentView.model.getAllDescendantModels(true).forEach(model => {
    if (!model.get('_isTrickleSiteConfigured')) return;
    const isLocked = model.get('_isLocked');
    const isTrickled = model.get('_isTrickled');
    console.log(`${model.get('_id')} isLocked: ${isLocked} isTrickled: ${isTrickled} `);
  });
}

/**
 * Utility functions for trickle model operations
 */
export default {
  _deepDefaults,
  configDefaults,
  getModelContainer,
  getModelConfigDefaults,
  getModelConfig,
  getCompletionAttribute,
  checkApplyLocks,
  applyLocks,
  _getSelfAndAncestorNextSiblings,
  addComponents,
  log,
  isModelSite
};
