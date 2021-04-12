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
  _isEnabled: true,
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
 * Sets the default trickle configuration for the given model
 * @param {Backbone.Model} model
 */
export function setModelDefaults(model) {
  const hasProxiedConfig = model.get('_trickleConfigId');
  if (hasProxiedConfig) {
    // Return if the model has been setup (a clone) and is now known to be proxied elsewhere.
    return;
  }
  const config = getModelConfig(model);
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
  setModelConfig(model, config);
}

/**
 * Returns the specified or derived trickle configuration for the given model
 * @param {Backbone.Model} model
 * @returns {Object}
 */
export function getModelConfig(model) {
  const inheritedConfigId = model.get('_trickleConfigId');
  if (inheritedConfigId) {
    const inheritedConfig = Adapt.findById(inheritedConfigId).get('_trickle');
    const localConfig = model.get('_trickle') || {};
    // Introduced for the AAT whereby explicit inheritance is required
    const isInheritedOnly = model.get(localConfig._isInherited);
    const localOverrides = isInheritedOnly ? {} : localConfig;
    const derivedConfig = $.extend(true, {}, inheritedConfig, localOverrides);
    return derivedConfig;
  }
  return model.get('_trickle');
}

/**
 * Set the specified trickle configuration for the given model
 * @param {Backbone.Model} model
 * @param {object} config
 */
export function setModelConfig(model, config) {
  model.unset('_trickleConfigId');
  model.set('_trickle', config);
}

/**
 * Add trickle configuration defaults to applicable models
 * @param {Backbone.Model} model
 */
export function checkApplyModelDefaults(model) {
  const trickleConfig = getModelConfig(model);
  if (!trickleConfig || !trickleConfig._isEnabled) return false;
  setModelDefaults(model);
}

/**
 * Fetch the defined or default completion attribute on which trickle should
 * listen for completion
 * @return {string}
 */
export function getCompletionAttribute() {
  var trickle = Adapt.config.get('_trickle');
  if (!trickle) return '_isComplete';
  return trickle._completionAttribute || '_isComplete';
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
  const completionAttribute = getCompletionAttribute();
  const locks = {};
  const modelsById = {};
  // Fetch the component model from the store incase it needs overriding by another extension
  const TrickleModel = Adapt.getModelClass('trickle-button');
  Adapt.course.getAllDescendantModels(true).forEach(siteModel => {
    const trickleConfig = siteModel.get('_trickle');
    // Check only sites with an enabled trickle configuration
    if (!trickleConfig || !trickleConfig._isEnabled) return;
    // Capture all subsequent parent models locked by each trickle configuration site
    let selfAndSubsequentLockingModels;
    if (trickleConfig._onChildren) {
      const firstChild = siteModel.getAvailableChildModels()[0];
      selfAndSubsequentLockingModels = _getSelfAndAncestorNextSiblings(firstChild);
    } else {
      selfAndSubsequentLockingModels = _getSelfAndAncestorNextSiblings(siteModel);
    }
    const siteId = siteModel.get('_id');
    selfAndSubsequentLockingModels.forEach((model, index) => {
      const id = model.get('_id');
      // Set the source trickle configuration and state of each model, except on injected buttons
      // which are configured elsewhere
      const isButtonModel = (model instanceof TrickleModel);
      if (!isButtonModel) {
        model.set({
          _trickleConfigId: siteId,
          _isTrickled: true
        });
      }
      const isFirst = (index === 0);
      if (isFirst) {
        // Store the new locking state of each model in the locks variable
        // Don't unlock anything that was locked in a previous group
        // Don't attempt to lock the first of each group as it should be accessible to the user
        modelsById[id] = model;
        locks[id] = locks[id] || false;
      } else {
        // Attempt to lock all other subsequent parent models
        const config = getModelConfig(model);
        const isStepLocked = config &&
          config._stepLocking &&
          config._stepLocking._isEnabled;
        const previousLockingModel = selfAndSubsequentLockingModels[index - 1];
        // Lock according to stepLocking config and previous model state
        const isLocked = isStepLocked &&
          !previousLockingModel.get(completionAttribute) &&
          !previousLockingModel.get('_isOptional');
        // Store the new locking state of each model in the locks variable
        // Don't unlock anything that was locked in a previous group
        modelsById[id] = model;
        locks[id] = locks[id] || isLocked;
      }
      // Cascade inherited locks through the hierarchy of each subsequent parent
      model.getAllDescendantModels().forEach(model => {
        const descendantId = model.get('_id');
        modelsById[descendantId] = model;
        locks[descendantId] = locks[id];
      });
    });
  });
  // Apply only changed locking states
  Object.entries(locks).forEach(([id, isLocked]) => {
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
    let trickleConfig = siteModel.get('_trickle');
    if (!trickleConfig || !trickleConfig._isEnabled) return;
    // Add a trickle button component model to each trickle site where applicable
    const siteId = siteModel.get('_id');
    const buttonModelSites = trickleConfig._onChildren ? siteModel.getChildren().models : [siteModel];
    buttonModelSites.forEach(buttonModelSite => {
      buttonModelSite.set({
        _isTrickled: true,
        _trickleConfigId: siteId
      });
      const trickleModel = new TrickleModel({
        _id: `trickle-${uid++}`,
        _type: 'component',
        _component: 'trickle-button',
        _parentId: buttonModelSite.get('_id'),
        _isAvailable: true,
        _layout: 'full',
        _trickleConfigId: siteId,
        _renderPosition: 'outer-append'
      });
      trickleModel.setupModel();
      // This line would usually append a trickle button to an article or block
      buttonModelSite.getChildren().add(trickleModel);
    });
  });
  applyLocks();
}

/**
 * Utility functions for trickle model operations
 */
export default {
  _deepDefaults,
  configDefaults,
  setModelDefaults,
  getModelConfig,
  setModelConfig,
  checkApplyModelDefaults,
  getCompletionAttribute,
  checkApplyLocks,
  applyLocks,
  _getSelfAndAncestorNextSiblings,
  addComponents
};
