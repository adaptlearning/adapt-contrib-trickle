import Adapt from 'core/js/adapt';
import a11y from 'core/js/a11y';
import ComponentView from 'core/js/views/componentView';
import controller from './controller';
import {
  getModelConfig,
  getCompletionAttribute
} from './models';

/** @typedef {import('core/js/modelEvent').default} ModelEvent  */

class TrickleButtonView extends ComponentView {

  className() {
    const config = getModelConfig(this.model.getParent());
    return [
      'trickle',
      this.model.get('_id'),
      config?._button._component,
      config?._button._isFullWidth && 'is-full-width',
      config?._button._className
    ].filter(Boolean).join(' ');
  }

  events() {
    return {
      'click .js-trickle-btn': 'onButtonClick'
    };
  }

  initialize() {
    this.openPopupCount = 0;
    this.isAwaitingPopupClose = false;
    this.wasButtonClicked = false;
    this.calculateButtonState();
    this.model.calculateButtonText();
    this.setupEventListeners();
    this.render();
    if (!this.model.isEnabled()) {
      this.setCompletionStatus();
    }
    _.defer(this.setReadyStatus.bind(this));
  }

  /**
   * Taking account of open popups, recalculate the button visible and enabled states
   */
  calculateButtonState() {
    const isDisabledByPopups = (this.openPopupCount > 0);
    this.model.calculateButtonState(isDisabledByPopups, this.wasButtonClicked);
  }

  render() {
    const data = this.model.toJSON();
    data._globals = Adapt.course.get('_globals');
    data._trickle = getModelConfig(this.model.getParent());
    this.$el.html(Handlebars.templates[TrickleButtonView.template](data));
  }

  setupEventListeners() {
    this.tryButtonAutoHide = this.tryButtonAutoHide.bind(this);
    // Add async delay on each call to onParent complete
    // to wait for autoscroll question feedback notify to appear
    const onParentComplete = this.onParentComplete.bind(this);
    this.onParentComplete = (...args) => _.delay(() => onParentComplete(...args), 100);
    this.listenTo(Adapt.parentView, 'postRemove', this.onRemove);
    this.listenTo(Adapt, 'trickle:killed', this.updateButtonState);
    if (this.model.isStepUnlocked() && this.model.isFinished()) {
      // Already complete, no need to listen to anything else
      return;
    }
    this.$el.on('onscreen', this.tryButtonAutoHide);
    this.listenTo(Adapt, {
      'popup:opened': this.onPopupOpened,
      'popup:closed': this.onPopupClosed
    });
    const parentModel = this.model.getParent();
    const completionAttribute = getCompletionAttribute(parentModel);
    this.listenTo(parentModel, {
      'change:_requireCompletionOf': this.onStepUnlocked,
      [`bubble:change:${completionAttribute}`]: this.onStepUnlocked,
      [`change:${completionAttribute}`]: this.onParentComplete
    });
  }

  /**
   * Keep count of the number of open popups
   */
  onPopupOpened() {
    this.openPopupCount++;
    const shouldUserInteractWithButton = (this.model.isStepUnlocked() && !this.model.isFinished());
    if (!shouldUserInteractWithButton) return;
    this.updateButtonState();
  }

  /**
   * Keep count of the number of open popups
   */
  async onPopupClosed() {
    this.openPopupCount--;
    if (this.openPopupCount) return;
    if (this.isAwaitingPopupClose) {
      // Had completed with an open popup, perform final part of finishing
      return this.finish();
    }
    const shouldUserInteractWithButton = (this.model.isStepUnlocked() && !this.model.isFinished());
    if (!shouldUserInteractWithButton) return;
    this.updateButtonState();
    await Adapt.parentView.addChildren();
  }

  /**
   * Modify the DOM according to the current button states
   */
  updateButtonState() {
    this.calculateButtonState();
    const isButtonHidden = !(this.model.get('_isButtonVisible') && !this.model.get('_isButtonAutoHidden'));
    this.$('.js-trickle-btn-container').toggleClass('u-display-none', isButtonHidden);
    const isButtonDisabled = this.model.get('_isButtonDisabled');
    const $button = this.$('.js-trickle-btn');
    const $ariaLabel = this.$('.aria-label');
    a11y.toggleEnabled($button, !isButtonDisabled);
    if (!isButtonDisabled) {
      // move focus forward if it's on the aria-label
      if (document.activeElement instanceof HTMLElement && document.activeElement.isSameNode($ariaLabel[0])) {
        a11y.focusNext($ariaLabel);
      }
      // make label unfocusable as it is no longer needed
      a11y.toggleAccessibleEnabled($ariaLabel, false);
    }
    const isButtonLocked = (this.model.get('_isButtonVisible')) && isButtonDisabled;
    $button.toggleClass('is-locked', isButtonLocked);
    const $buttonText = this.$('.js-trickle-btn-text');
    this.model.calculateButtonText();
    const text = this.model.get('buttonText');
    const ariaLabel = this.model.get('buttonAriaLabel');
    $buttonText.html(text);
    $button.attr('aria-label', ariaLabel);
  }

  /**
   * Update the button state when any completion changes occur in the trickle button
   * parent or descendants
   * @param {ModelEvent} event
   */
  async onStepUnlocked(event) {
    if (event.value === false) return;
    // Defer to allow for a feedback notify to open
    _.defer(this.updateButtonState.bind(this));
  }

  async onButtonClick() {
    const wasComplete = this.model.get('_isComplete');
    // Assuming step locking completion is required, setting this model as complete
    // will cause onParentComplete to fire
    this.model.setCompletionStatus();
    this.wasButtonClicked = true;
    const isStepLockingCompletionRequired = this.model.isStepLockingCompletionRequired();
    if (isStepLockingCompletionRequired && !wasComplete) return;
    // Assuming step locking completion is NOT required, continue and scroll
    await this.continue();
  }

  /**
   * Fires when all children in the button parent are complete, including the button
   */
  async onParentComplete(model, value) {
    if (!value) return;
    const parentModel = this.model.getParent();
    const completionAttribute = getCompletionAttribute(parentModel);
    this.stopListening(parentModel, {
      [`bubble:change:${completionAttribute}`]: this.onStepUnlocked,
      [`change:${completionAttribute}`]: this.onParentComplete
    });
    if (controller.isKilled) return;
    if (this.openPopupCount > 0) {
      // Has completed with an open popup, defer finish until popup closed
      this.isAwaitingPopupClose = true;
      return;
    }
    await this.finish();
  }

  /**
   * Stop listening, update the button and continue if required
   */
  async finish() {
    this.stopListening(Adapt, {
      'popup:opened': this.onPopupOpened,
      'popup:closed': this.onPopupClosed
    });
    this.updateButtonState();
    const isStepLockingCompletionRequired = this.model.isStepLockingCompletionRequired();
    if (!isStepLockingCompletionRequired) return;
    // Continue and scroll only if steplocking completion is required
    await this.continue();
  }

  /**
   * Causes Adapt to attempt to render more children and scroll to the next content
   * element if required
   */
  async continue() {
    const parent = this.model.getParent();
    await controller.continue();
    await controller.scroll(parent);
  }

  tryButtonAutoHide() {
    if (!this.model.get('_isButtonVisible')) return;
    const trickleConfig = getModelConfig(this.model.getParent());
    if (!trickleConfig._button._autoHide) {
      this.model.set('_isButtonAutoHidden', false);
      return;
    }
    const measurements = this.$el.onscreen();
    // This is to fix common miscalculation issues
    const isJustOffscreen = (measurements.bottom > -100);
    const isButtonAutoHidden = !measurements.onscreen && !isJustOffscreen;
    this.model.set('_isButtonAutoHidden', isButtonAutoHidden);
    this.updateButtonState();
  }

  onRemove() {
    this.$el.off('onscreen', this.tryButtonAutoHide);
    this.remove();
  }

}

TrickleButtonView.template = 'trickle-button';

export default TrickleButtonView;
