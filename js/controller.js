import Adapt from 'core/js/adapt';
import data from 'core/js/data';
import a11y from 'core/js/a11y';
import {
  checkApplyLocks,
  addButtonComponents,
  applyLocks,
  getModelConfig,
  isModelArticleWithOnChildren
} from './models';

/** @typedef {import('core/js/childEvent').default} ChildEvent  */

class TrickleController extends Backbone.Controller {

  initialize() {
    this.checkIsFinished = _.debounce(this.checkIsFinished, 1);
    this.listenTo(data, {
      // Check that the locking is accurate after any completion
      'change:_isInteractionComplete change:_isComplete change:_isAvailable add remove': checkApplyLocks,
      // Check whether trickle is finished after any locking changes
      'change:_isLocked': this.checkIsFinished
    });
    this.listenTo(Adapt, {
      // Reapply locks after assessment reset, this happens asynchronously
      'assessments:reset': applyLocks,
      // Reset trickle's global state when changing content objects
      'contentObjectView:preRender': this.reset,
      // Stop rendering where necessary before a child is rendered
      'view:addChild': this.onAddChildView,
      // Temporarily remove trickle from the current content object
      'trickle:kill': this.kill
    });
    this.onDataReady();
  }

  async onDataReady() {
    await data.whenReady();
    Adapt.wait.for(done => {
      addButtonComponents();
      applyLocks();
      done();
    });
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
    const isTrickling = Adapt.parentView.model.getAllDescendantModels().some(model => {
      return model.get('_isAvailable') && model.get('_isTrickled') && model.get('_isLocked');
    });
    return isTrickling;
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
    if (scrollToId === '') return;

    const isDescendant = Adapt.parentView.model.getAllDescendantModels().some(model => {
      return model.get('_id') === scrollToId;
    });
    if (!isDescendant) {
      applyLocks();
      // Navigate to another content object
      const model = Adapt.findById(scrollToId);
      const contentObject = model.isTypeGroup('contentobject') ? model : model.findAncestor('contentobject');
      await Adapt.navigateToElement(contentObject.get('_id'));
      // Recalculate the relative id after the page is ready as it may change
      scrollToId = getScrollToId();
      await Adapt.navigateToElement(scrollToId);
      return;
    }

    await Adapt.parentView.renderTo(scrollToId);

    if (hasTrickleButton) {
      // Only set focus if there is a trickle button - see https://github.com/adaptlearning/adapt_framework/issues/2813
      a11y.focusFirst($('.' + scrollToId), { preventScroll: true });
    }

    if (isAutoScrollOff) return false;

    const duration = trickleConfig._scrollDuration || 500;
    Adapt.scrollTo('.' + scrollToId, { duration });
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
    const TrickleModel = Adapt.getModelClass('trickle-button');
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
  reset() {
    this.isKilled = false;
    if (!this.isTrickling) {
      this.isStarted = false;
      this.isFinished = false;
      return;
    }
    this.isStarted = true;
    this.isFinished = false;
  }

}

export default new TrickleController();
