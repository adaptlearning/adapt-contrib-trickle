define([
  'core/js/adapt',
  'core/js/models/contentObjectModel',
  'core/js/models/courseModel',
  'core/js/childEvent',
  './deepDefaults',
  './trickleButton'
], function(Adapt, ContentObjectModel, CourseModel, ChildEvent, deepDefaults) {

  class Trickle extends Backbone.Controller {

    configDefaults() {
      return {
        _isEnabled: true,
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
          startText: '',
          finalText: ''
        },
        _stepLocking: {
          _isEnabled: true,
          _isCompletionRequired: true,
          _isLockedOnRevisit: false
        }
      };
    }

    initialize() {
      this.checkIfIsTrickleFinished = _.debounce(this.checkIfIsTrickleFinished, 1);
      this.listenTo(Adapt.data, {
        'add': this.onModelAdded,
        'change:_isLocked': this.checkIfIsTrickleFinished
      });
      this.listenTo(Adapt, {
        'app:dataLoaded': this.onDataReady,
        'pageView:preRender': this.onPageViewPreRender,
        'trickle:kill': this.onTrickleKill
      });
    }

    /**
     * Add trickle configuration defaults to applicable models
     * @param {Backbone.Model} model
     */
    onModelAdded(model) {
      const trickleConfig = this.getModelConfig(model);
      if (!trickleConfig || !trickleConfig._isEnabled) return false;
      this.setModelDefaults(model);
    }

    /**
     * Sets the specified default trickle configuration for the give model
     * @param {Backbone.Model} model
     */
    setModelDefaults(model) {
      // Apply defaults to original trickle configuration
      const config = Adapt.trickle.getModelConfig(model);
      // Check if the config came from another model
      const hasProxiedConfig = model.get('_trickleConfigId');
      if (hasProxiedConfig) return;
      // Setup default legacy article behaviour
      // onChildren === isArticle if omitted
      const isArticle = (model.get('_type') === 'article');
      deepDefaults(config, this.configDefaults(), {
        _onChildren: isArticle
      });
      // Default startText and finalText when _onChildren: true
      if (config._onChildren) {
        config._button.startText = config._button.startText || 'Begin';
        config._button.finalText = config._button.finalText || 'Finish';
      }
      // Force step locking for _isFullWidth buttons
      if (config._button._isFullWidth) {
        config._stepLocking._isEnabled = true;
      }
      Adapt.trickle.setModelConfig(model, config);
    }

    /**
     * Returns the specified or derived trickle configuration for the given model
     * @param {Backbone.Model} model
     * @returns {Object}
     */
    getModelConfig(model) {
      const inheritedConfigId = model.get('_trickleConfigId');
      if (inheritedConfigId) {
        const inheritedConfig = Adapt.findById(inheritedConfigId).get('_trickle');
        const localOverrides = model.get('_trickle');
        const derivedConfig = $.extend(true, {}, inheritedConfig, localOverrides);
        return derivedConfig;
      }
      return model.get('_trickle');
    }

    /**
     * Set the specified trickle configuration for the give model
     * @param {Backbone.Model} model
     * @param {object} config
     */
    setModelConfig(model, config) {
      model.unset('_trickleConfigId');
      model.set('_trickle', config);
    }

    onDataReady() {
      this.setupEventListeners();
      this.addComponents();
      this.applyLocks();
    }

    setupEventListeners() {
      this.listenTo(Adapt.data, {
        'change:_isInteractionComplete': this.applyLocks
      });
      this.listenTo(Adapt, {
        'contentObjectView:preRender': this.applyLocks,
        'view:addChild': this.onAddChild
      });
    }

    /**
     * Adds trickle button components in their relevant places throughout the course
     */
    addComponents() {
      // Fetch the component model from the store incase it needs overriding by another extension
      const TrickleModel = Adapt.getModelClass('trickle-button');
      let uid = 0;
      Adapt.data.forEach(siteModel => {
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
          // Typically this line would append a trickle button to an article or block
          buttonModelSite.getChildren().add(trickleModel);
        });
      });
    }

    /**
     * Calculates and applies the new locking state for each sub-page model according
     * to each trickle configuration
     */
    applyLocks() {
      if (Adapt.trickle.isKilled) return;
      const completionAttribute = this.getCompletionAttribute();
      const locks = {};
      const modelsById = {};
      // Fetch the component model from the store incase it needs overriding by another extension
      const TrickleModel = Adapt.getModelClass('trickle-button');
      Adapt.course.getAllDescendantModels(true).forEach(siteModel => {
        const trickleConfig = siteModel.get('_trickle');
        // Check only sites with an enabled trickle configurations
        if (!trickleConfig || !trickleConfig._isEnabled) return;
        // Capture all subsequent models locked by each trickle configuration site
        let selfAndSubsequentLockingModels;
        if (trickleConfig._onChildren) {
          const firstChild = siteModel.getAvailableChildModels()[0];
          selfAndSubsequentLockingModels = this._getSelfAndAncestorNextSiblings(firstChild);
        } else {
          selfAndSubsequentLockingModels = this._getSelfAndAncestorNextSiblings(siteModel);
        }
        const siteId = siteModel.get('_id');
        selfAndSubsequentLockingModels.forEach((model, index) => {
          const id = model.get('_id');
          // Set the source trickle configuration and state of each model, except injected buttons
          const isButtonModel = (model instanceof TrickleModel);
          if (!isButtonModel) {
            model.set({
              _trickleConfigId: siteId,
              _isTrickled: true
            });
          }
          const isFirst = (index === 0);
          if (isFirst) {
            // Don't attempt to lock the first of each group as it should be accessible to the user
            modelsById[id] = model;
            // Don't unlock anything that was locked in a previous group
            locks[id] = locks[id] || false;
          } else {
            // Attempt to lock all other subsequent models
            const config = this.getModelConfig(model);
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
          // Cascase inherited locks through the hierarchy
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
     * Fetch the defined or default completion attribute on which trickle should
     * listen for completion
     * @return {string}
     */
    getCompletionAttribute() {
      var trickle = Adapt.config.get('_trickle');
      if (!trickle) return '_isComplete';
      return trickle._completionAttribute || '_isComplete';
    }

    /**
     * Returns all of the contentobject descendant models directly subsequent to the
     * specified model through each ancestor
     * If fromModel is a component; its next sibling components, next block siblings
     * and next article siblings will be returned
     * @param {Backbone.Model} child
     * @returns {Array<Backbone.Model>}
     */
    _getSelfAndAncestorNextSiblings(fromModel) {
      if (!fromModel) return [];
      // Fetch all subsequent siblings
      const allSiblings = fromModel.getParent().getAvailableChildModels();
      const selfAndSubsequentSiblings = allSiblings.slice(allSiblings.findIndex(sibling => sibling === fromModel));
      // Fetch all ancestors between the page and the child
      const allAncestors = fromModel.getAncestorModels();
      const inPageAncestors = allAncestors.slice(0, allAncestors.findIndex(parent => parent instanceof ContentObjectModel) + 1);
      // Move from the next ancestor down as we already have the parent's children (fromModel siblings)
      // Collect all subsequent in-page siblings
      const subsequentInPageAncestors = [];
      inPageAncestors.slice(1).forEach((grandParent, previousIndex) => {
        const parent = inPageAncestors[previousIndex];
        const allGrandParentChildren = grandParent.getAvailableChildModels();
        const subsequentAncestorSiblings = allGrandParentChildren.slice(allGrandParentChildren.findIndex(child => child === parent) + 1);
        subsequentInPageAncestors.push(...subsequentAncestorSiblings);
      });
      const selfAndSubsequentContentObjectDescendantModels = selfAndSubsequentSiblings.concat(subsequentInPageAncestors);
      return selfAndSubsequentContentObjectDescendantModels;
    }

    /**
     * Reset the page trickle state when rendered
     */
    onPageViewPreRender() {
      Adapt.trickle.isKilled = false;
      if (!this.isTrickling) {
        Adapt.trickle.isStarted = false;
        Adapt.trickle.isFinished = false;
        return;
      }
      Adapt.trickle.isStarted = true;
      Adapt.trickle.isFinished = false;
    }

    /**
     * When the trickle:kill event is triggered externally, turn off all trickle
     * locking, continue rendering and set the page model state as killed
     */
    async onTrickleKill() {
      // Fetch the component model from the store incase it needs overriding by another extension
      const TrickleModel = Adapt.getModelClass('trickle-button');
      Adapt.trickle.isKilled = true;
      Adapt.parentView.model.getAllDescendantModels().forEach(model => {
        const isButtonModel = (model instanceof TrickleModel);
        if (isButtonModel) {
          model.setCompletionStatus();
        }
        if (!model.get('_isTrickled')) return;
        model.set('_isLocked', false);
      });
      await this.continue();
    }

    /**
     * Returns true if the current page is or was locked by trickle
     */
    get isStarted() {
      if (!Adapt.parentView) return false;
      return Adapt.parentView.model.get('_isTrickleStarted');
    }

    set isStarted(value) {
      if (!Adapt.parentView) return;
      Adapt.parentView.model.set('_isTrickleStarted', value);
      if (value) {
        Adapt.trigger('trickle:started');
      }
    }

    /**
     * Returns true if the current page is locked by trickle
     */
    get isTrickling() {
      const isTrickling = Boolean(Adapt.parentView.model.getAllDescendantModels().find(model => {
        return model.get('_isAvailable') && model.get('_isTrickled') && model.get('_isLocked');
      }));
      return isTrickling;
    }

    /**
     * Returns true if the current page was locked by trickle and is now finished
     */
    get isFinished() {
      if (!Adapt.parentView) return false;
      return !Adapt.trickle.isStarted || Adapt.parentView.model.get('_isTrickleFinished') || Adapt.trickle.isKilled;
    }

    set isFinished(value) {
      if (!Adapt.parentView) return;
      Adapt.parentView.model.set('_isTrickleFinished', value);
      if (value) {
        Adapt.trigger('trickle:finished');
      }
    }

    /**
     * Returns true if the current page was locked by trickle and is now killed
     */
    get isKilled() {
      if (!Adapt.parentView) return false;
      return !Adapt.trickle.isStarted || Adapt.parentView.model.get('_isTrickleKilled');
    }

    set isKilled(value) {
      if (!Adapt.parentView) return;
      Adapt.parentView.model.set('_isTrickleKilled', value);
      if (value) {
        Adapt.trigger('trickle:killed');
      }
    }

    checkIfIsTrickleFinished() {
      if (!Adapt.trickle.isStarted) return;
      if (Adapt.trickle.isKilled || Adapt.trickle.isFinished) return;
      if (Adapt.trickle.isTrickling) return;
      Adapt.trickle.isFinished = true;
    }

    /**
     * When each child view is added to its parent, check to see if trickle should
     * stop the render at this child according to the locking state
     * @param {ChildEvent} event
     */
    onAddChild(event) {
      if (Adapt.trickle.isKilled) return;
      if (event.hasRequestChild) {
        this.applyLocks();
      }
      const isManagedByTrickleAndLocked = (event.model.get('_isTrickled') && event.model.get('_isLocked'));
      if (!isManagedByTrickleAndLocked) return;
      event.stop();
    }

    /**
     * Make the framework try to render the next set of children
     */
    async continue() {
      this.applyLocks();
      await Adapt.parentView.addChildren();
      await Adapt.parentView.whenReady();
    }

    /**
     * Scroll to the next section as defined by the trickle configuration on the
     * specified model
     * @param {Backbone.Model} fromModel
     */
    async scroll(fromModel) {
      const trickle = this.getModelConfig(fromModel);
      if (!trickle || !trickle._isEnabled) return false;

      const isArticleWithOnChildren = (fromModel.get('_type') === 'article' && trickle._onChildren);
      if (isArticleWithOnChildren) return false;

      const isAutoScrollOff = !trickle._autoScroll;
      const hasTrickleButton = trickle._button._isEnabled;
      if (isAutoScrollOff && !hasTrickleButton) {
        return;
      }

      const scrollTo = trickle._scrollTo;
      const firstCharacter = scrollTo.substr(0, 1);
      let scrollToId = '';
      switch (firstCharacter) {
        case '@':
          // NAVIGATE BY RELATIVE TYPE
          // Allows trickle to scroll to a sibling / cousin component
          // relative to the current trickle item
          var relativeModel = fromModel.findRelativeModel(scrollTo, {
            filter: (model) => {
              return model.get('_isAvailable');
            }
          });
          if (relativeModel === undefined) return;
          scrollToId = relativeModel.get('_id');
          break;
        case '.':
          // NAVIGATE BY CLASS
          scrollToId = scrollTo.substr(1, scrollTo.length - 1);
          break;
        default:
          scrollToId = scrollTo;
      }

      if (scrollToId === '') return;

      const isDescendant = Boolean(Adapt.parentView.model.getAllDescendantModels().find(model => model.get('_id') === scrollToId));
      if (!isDescendant) {
        this.applyLocks();
        await Adapt.navigateToElement(scrollToId);
        return;
      }

      await Adapt.parentView.renderTo(scrollToId);

      if (hasTrickleButton) {
        // Only set focus if there's a trickle button - see https://github.com/adaptlearning/adapt_framework/issues/2813
        Adapt.a11y.focusFirst($('.' + scrollToId));
      }

      if (isAutoScrollOff) return false;

      const duration = trickle._scrollDuration || 500;
      Adapt.scrollTo('.' + scrollToId, { duration });
    }

  }

  return (Adapt.trickle = new Trickle());

});
