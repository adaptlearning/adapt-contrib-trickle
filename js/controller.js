import Adapt from 'core/js/adapt';
import wait from 'core/js/wait';
import components from 'core/js/components';
import data from 'core/js/data';
import a11y from 'core/js/a11y';
import logging from 'core/js/logging';
import {
  checkApplyLocks,
  addButtonComponents,
  applyLocks,
  debouncedApplyLocks,
  getModelConfig,
  isModelArticleWithOnChildren
} from './models';
import router from 'core/js/router';

/** @typedef {import('core/js/childEvent').default} ChildEvent  */

class TrickleController extends Backbone.Controller {

  initialize() {
    this.checkIsFinished = _.debounce(this.checkIsFinished, 1);

    this.listenTo(Adapt, {
      'adapt:start': this.onAdaptStart
    });
  }

  async onAdaptStart() {
    const trickleConfig = Adapt.config.get('_trickle');
    if (trickleConfig?._isEnabled === false) return;

    this.setUpEventListeners();

    wait.for(done => {
      addButtonComponents();
      applyLocks();
      done();
    });
  }

  setUpEventListeners() {
    this.stopListening();
    this.listenTo(data, {
      // Check that the locking is accurate after any completion, this happens asynchronously
      'change:_isInteractionComplete change:_isComplete change:_isAvailable add remove': checkApplyLocks,
      // Check whether trickle is finished after any locking changes
      'change:_isLocked': this.checkIsFinished
    });
    this.listenTo(Adapt, {
      'adapt:start': this.onAdaptStart,
      // Reapply locks after assessment reset, this happens asynchronously where possible
      'assessments:reset': this.onAssessmentReset,
      // Reset trickle's global state when changing content objects
      'contentObjectView:preRender': this.reset,
      // Stop rendering where necessary before a child is rendered
      'view:addChild': this.onAddChildView,
      // Temporarily remove trickle from the current content object
      'trickle:kill': this.kill
    });
  }

  onAssessmentReset() {
    // If mid render then apply locks immediately
    const isMidRender = !Adapt.parentView?.model.get('_isReady');
    if (isMidRender) return applyLocks();
    // Otherwise apply them lazily
    debouncedApplyLocks();
  }

  /**
   * Returns true if the current page is or was locked by trickle
   */
  get isStarted() {
    return Boolean(Adapt.parentView?.model.get('_isTrickleStarted'));
  }

  set isStarted(value) {
    if (!Adapt.parentView) return;
    Adapt.parentView.model.set('_isTrickleStarted', value);
    if (!value) return;
    Adapt.trigger('trickle:started');
  }

  /**
   * When each child view is added to its parent, check to see if trickle should
   * stop the render at this child according to the locking state
   * @param {ChildEvent} event
   */
  onAddChildView(event) {
    if (this.isKilled) return;
    if (event.hasRequestChild) applyLocks();
    const isManagedByTrickleAndLocked = (event.model.get('_isTrickled') && event.model.get('_isLocked'));
    if (!isManagedByTrickleAndLocked) return;
    event.stop();
  }

  /**
   * Returns true if the current page is locked by trickle
   */
  get isTrickling() {
    const currentDescendants = Adapt.parentView.model.getAllDescendantModels();
    const isDescendantBlockedByTrickle = currentDescendants.some(model => model.get('_isAvailable') && model.get('_isTrickled') && model.get('_isLocked'));
    if (isDescendantBlockedByTrickle) return true;
    const TrickleModel = components.getModelClass('trickle-button');
    const lastDescendant = currentDescendants[currentDescendants.length - 1];
    const lastTrickleButton = currentDescendants.reverse().find(model => (model instanceof TrickleModel));
    const isLastDescendantExpectingMoreChildren = (lastDescendant.get('_requireCompletionOf') === Number.POSITIVE_INFINITY && lastDescendant.get('_canRequestChild'));
    const isLastTrickleButtonWaiting = (!lastTrickleButton?.get('_isComplete'));
    return (isLastDescendantExpectingMoreChildren && isLastTrickleButtonWaiting);
  }

  /**
   * Make the framework try to render the next set of children
   */
  async continue() {
    applyLocks();
    await Adapt.parentView.addChildren();
    await Adapt.parentView.whenReady();
  }

  /**
   * Scroll to the next section as defined by the trickle configuration on the
   * specified model
   * @param {Backbone.Model} fromModel
   */
  async scroll(fromModel) {
    const trickleConfig = getModelConfig(fromModel);
    if (!trickleConfig?._isEnabled) return false;

    if (isModelArticleWithOnChildren(fromModel)) return false;

    const isAutoScrollOff = !trickleConfig._autoScroll;
    const hasTrickleButton = trickleConfig._button._isEnabled;
    if (isAutoScrollOff && !hasTrickleButton) {
      return;
    }

    const getScrollToId = () => {
      const scrollTo = trickleConfig._scrollTo;
      const firstCharacter = scrollTo.substr(0, 1);
      switch (firstCharacter) {
        case '@': {
          // NAVIGATE BY RELATIVE TYPE
          // Allows trickle to scroll to a sibling / cousin component
          // relative to the current trickle item
          const relativeModel = fromModel.findRelativeModel(scrollTo, {
            filter: model => model.get('_isAvailable')
          });
          if (relativeModel === undefined) return;
          return relativeModel.get('_id');
        }
        case '.':
          // NAVIGATE BY CLASS
          return scrollTo.substr(1, scrollTo.length - 1);
        default:
          return scrollTo;
      }
    };

    let scrollToId = getScrollToId();
    if (!scrollToId) {
      logging.error(`Cannot scroll to the next id as none was found at id: "${fromModel.get('_id')}" with _scrollTo: "${trickleConfig._scrollTo}". Suggestion: Set _showEndOfPage to false.`)
      return
    }

    const isDescendant = Adapt.parentView.model.getAllDescendantModels().some(model => {
      return model.get('_id') === scrollToId;
    });
    if (!isDescendant) {
      applyLocks();
      // Navigate to another content object
      const model = data.findById(scrollToId);
      const contentObject = model.isTypeGroup('contentobject') ? model : model.findAncestor('contentobject');
      await router.navigateToElement(contentObject.get('_id'));
      // Recalculate the relative id after the page is ready as it may change
      scrollToId = getScrollToId();
      await router.navigateToElement(scrollToId);
      return;
    }

    await Adapt.parentView.renderTo(scrollToId);

    if (hasTrickleButton) {
      // Only set focus if there is a trickle button - see https://github.com/adaptlearning/adapt_framework/issues/2813
      a11y.focusFirst($('.' + scrollToId), { preventScroll: true });
    }

    if (isAutoScrollOff) return false;

    const duration = trickleConfig._scrollDuration || 500;
    router.navigateToElement('.' + scrollToId, { duration });
  }

  /**
   * Returns true if the current page was locked by trickle and is now finished
   */
  get isFinished() {
    if (!Adapt.parentView) return false;
    return Boolean(!this.isStarted || Adapt.parentView.model.get('_isTrickleFinished') || this.isKilled);
  }

  set isFinished(value) {
    if (!Adapt.parentView) return;
    Adapt.parentView.model.set('_isTrickleFinished', value);
    if (!value) return;
    Adapt.trigger('trickle:finished');
  }

  checkIsFinished() {
    if (!this.isStarted) return;
    if (this.isKilled || this.isFinished) return;
    if (this.isTrickling) return;
    this.isFinished = true;
  }

  /**
   * Turn off all trickle locking, continue rendering and set the page model state as killed
   */
  async kill() {
    // Fetch the component model from the store incase it needs overriding by another extension
    const TrickleModel = components.getModelClass('trickle-button');
    this.isKilled = true;
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
   * Returns true if the current page was locked by trickle and is now killed
   */
  get isKilled() {
    if (!Adapt.parentView) return false;
    return !this.isStarted || Adapt.parentView.model.get('_isTrickleKilled');
  }

  set isKilled(value) {
    if (!Adapt.parentView) return;
    Adapt.parentView.model.set('_isTrickleKilled', value);
    if (!value) return;
    Adapt.trigger('trickle:killed');
  }

  /**
   * Reset the page trickle state
   */
  async reset() {
    await wait.queue();
    this.isKilled = false;
    this.isStarted = this.isTrickling;
    this.isFinished = false;
  }

}

export default new TrickleController();
