import controller from './controller';
import ComponentModel from 'core/js/models/componentModel';
import {
  getModelContainer,
  getModelConfig,
  getCompletionAttribute,
  applyLocks
} from './models';

export default class TrickleButtonModel extends ComponentModel {

  init() {
    super.init();
    if (!this.isStepComplete()) return;
    this.setCompletionStatus();
  }

  /**
   * @returns {boolean} true if the button is enabled in its trickle configuration
   */
  isEnabled() {
    const trickleConfig = getModelConfig(this.getParent());
    if (!trickleConfig) return false;
    const isEnabled = trickleConfig._isEnabled && trickleConfig._button?._isEnabled;
    return isEnabled;
  }

  /**
   * @return {boolean} true if page truncation (step locking) is active
   */
  isStepLocking() {
    const config = getModelConfig(this.getParent());
    if (!config) return false;
    const isStepLocking = config._stepLocking?._isEnabled;
    return isStepLocking;
  }

  /**
   * @return {boolean} true if completion is required to unlock this step
   */
  isStepLockingCompletionRequired() {
    const config = getModelConfig(this.getParent());
    if (!config) return false;
    const isStepLockingCompletionRequired = config._stepLocking &&
      config._stepLocking._isEnabled &&
      config._stepLocking._isCompletionRequired;
    return isStepLockingCompletionRequired;
  }

  /**
   * @returns {boolean} true if all available siblings are complete, optional or not available
   */
  isStepUnlocked() {
    const parentModel = this.getParent();
    const completionAttribute = getCompletionAttribute(parentModel);
    // Check if completion is blocked by another extension
    const isCompletionBlocked = (parentModel.get('_requireCompletionOf') === Number.POSITIVE_INFINITY);
    if (isCompletionBlocked) return;
    // use getParent().getChildren() instead of getSiblings() as children change but siblings don't
    return this.getParent().getChildren().every(sibling => {
      if (sibling === this) {
        return true;
      }
      return sibling.get(completionAttribute) ||
        sibling.get('_isOptional') ||
        !sibling.get('_isAvailable');
    });
  }

  /**
   * @returns {boolean} true if the parent container is already complete
   */
  isStepComplete() {
    const parentModel = this.getParent();
    const completionAttribute = getCompletionAttribute(parentModel);
    const isParentComplete = parentModel.get(completionAttribute);
    return isParentComplete;
  }

  /**
   * @returns {boolean} true if this button should always be locked on revisit
   */
  isStepLockedOnRevisit() {
    const trickleConfig = getModelConfig(this.getParent());
    return Boolean(trickleConfig._stepLocking._isLockedOnRevisit);
  }

  /**
   * @return {boolean} true if completion is not required or if completion has been fulfilled
   * and the button has been clicked
   */
  isFinished() {
    const isStepUnlocked = this.isStepUnlocked();
    const isStepLockingCompletionRequired = this.isStepLockingCompletionRequired();
    const isButtonComplete = this.get('_isComplete');
    const isFinished = ((isStepUnlocked || !isStepLockingCompletionRequired) && isButtonComplete);
    return isFinished;
  }

  isLastInContentObject() {
    const contentObject = this.findAncestor('contentobject');
    const allDescendants = contentObject.getAllDescendantModels(true);
    const lastDescendant = allDescendants[allDescendants.length - 1];
    const parentModel = this.getParent();
    const trickleParent = getModelContainer(parentModel);
    // Check if completion is blocked by another extension
    const isParentFinished = (trickleParent.get('_requireCompletionOf') !== Number.POSITIVE_INFINITY);
    return (isParentFinished && this === lastDescendant);
  }

  /**
   * Apply start and final text amongst the current siblings
   * Siblings in assessments can be randomised so this must be derived at runtime
   */
  calculateButtonText() {
    const parentModel = this.getParent();
    const trickleConfig = getModelConfig(parentModel);
    if (!trickleConfig) return;
    let isStart = false;
    let isFinal = false;
    const isDisabled = this.get('_isButtonDisabled');
    if (trickleConfig._onChildren) {
      const parentId = parentModel.get('_id');
      const trickleParent = getModelContainer(parentModel);
      const trickleSiblings = trickleParent.getAllDescendantModels(true).filter(model => {
        return model.get('_isAvailable') && model.get('_isTrickled');
      });
      const index = trickleSiblings.findIndex(model => model.get('_id') === parentId);
      isStart = (index === 0);
      isFinal = (index === trickleSiblings.length - 1 && !trickleParent.get('_canRequestChild'));
    }
    const text = (isDisabled && trickleConfig._button.disabledText) ?
      trickleConfig._button.disabledText :
      (isStart && trickleConfig._button.startText) ?
      trickleConfig._button.startText :
      (isFinal && trickleConfig._button.finalText) ?
      trickleConfig._button.finalText :
      trickleConfig._button.text;

    const ariaLabel = (isDisabled && trickleConfig._button.disabledAriaLabel) ?
      trickleConfig._button.disabledAriaLabel : 
      (isStart && trickleConfig._button.startAriaLabel) ?
      trickleConfig._button.startAriaLabel :
      (isFinal && trickleConfig._button.finalAriaLabel) ?
      trickleConfig._button.finalAriaLabel :
      trickleConfig._button.ariaLabel;

    this.set({
      buttonText: text,
      buttonAriaLabel: ariaLabel
    });
  }

  /**
   * Will reset this button if the step has been unlocked and should be relocked
   * on revisit
   */
  checkIfResetOnRevisit() {
    if (this.isFinished() && !this.isStepLockedOnRevisit()) return;
    if (!this.get('_isComplete') && !this.get('_isInteractionComplete')) return;
    this.set({
      _isComplete: false,
      _isInteractionComplete: false
    });
    applyLocks();
  }

  /**
   * Calculate the current button visible and enabled states
   * @param {boolean} isButtonDisableForced Set to true to signify that the button must not be enabled
   * @param {boolean} isButtonHiddenForced Set to true to signify that the button must not be visible
   */
  calculateButtonState(isButtonDisableForced = false, isButtonHiddenForced = false) {
    if (!this.isEnabled()) {
      this.set({
        _isButtonVisible: false,
        _isButtonDisabled: !this.isStepUnlocked()
      });
      return;
    };

    const trickleConfig = getModelConfig(this.getParent());
    if (this.isLastInContentObject() && trickleConfig._button._showEndOfPage === false) {
      return this.set({
        _isButtonVisible: false,
        _isButtonDisabled: true
      });
    }

    const isTrickleKilled = controller.isKilled;
    const isStepUnlocked = this.isStepUnlocked() || isTrickleKilled;
    const isFinished = this.isFinished() || isTrickleKilled;
    const isButtonVisibleBeforeCompletion = (trickleConfig._button._styleBeforeCompletion !== 'hidden');
    // Force button to be hidden after completion if _isFullWidth, otherwise absolutely positioned buttons will stack
    const isButtonVisibleAfterCompletion = (trickleConfig._button._styleAfterClick !== 'hidden') && !trickleConfig._button._isFullWidth;

    const isStepLockingCompletionRequired = this.isStepLockingCompletionRequired();

    const isNoCompletionRequiredAndLockedVisible = (!isStepLockingCompletionRequired && !isFinished && isButtonVisibleBeforeCompletion);
    const isNoCompletionRequiredAndUnlockedVisible = (!isStepLockingCompletionRequired && isStepUnlocked && !isFinished);
    const isNoCompletionRequiredAndFinishedVisible = (!isStepLockingCompletionRequired && isFinished && isButtonVisibleAfterCompletion);
    const isStepLockedAndVisibleBeforeCompletion = (isStepLockingCompletionRequired && !isStepUnlocked && isButtonVisibleBeforeCompletion && !isButtonHiddenForced);
    const isFinishedAndVisibleAfterCompletion = (isStepLockingCompletionRequired && isFinished && isButtonVisibleAfterCompletion);
    const isStepUnlockedAndButtonIncomplete = (isStepLockingCompletionRequired && isStepUnlocked && !isFinished);

    const isButtonVisible = isNoCompletionRequiredAndLockedVisible ||
      isNoCompletionRequiredAndUnlockedVisible ||
      isNoCompletionRequiredAndFinishedVisible ||
      isStepLockedAndVisibleBeforeCompletion ||
      isFinishedAndVisibleAfterCompletion ||
      isStepUnlockedAndButtonIncomplete;

    const isButtonEnabledBeforeCompletion = (trickleConfig._button._styleBeforeCompletion !== 'disabled');
    const isButtonEnabledAfterCompletion = (trickleConfig._button._styleAfterClick !== 'disabled');

    const isNoCompletionRequiredAndLockedEnabled = (!isStepLockingCompletionRequired && !isFinished && isButtonEnabledBeforeCompletion);
    const isNoCompletionRequiredAndUnlockedEnabled = (!isStepLockingCompletionRequired && isStepUnlocked && !isFinished);
    const isNoCompletionRequiredAndFinishedEnabled = (!isStepLockingCompletionRequired && isFinished && isButtonEnabledAfterCompletion);
    const isStepUnlockedAndButtonIncompleteWithoutButtonDisabledForced = (isStepLockingCompletionRequired && isStepUnlockedAndButtonIncomplete && !isButtonDisableForced);
    const isFinishedAndEnabledAfterCompletion = (isStepLockingCompletionRequired && isFinished && isButtonEnabledAfterCompletion);

    const isButtonEnabled = isNoCompletionRequiredAndLockedEnabled ||
      isNoCompletionRequiredAndUnlockedEnabled ||
      isNoCompletionRequiredAndFinishedEnabled ||
      isStepUnlockedAndButtonIncompleteWithoutButtonDisabledForced ||
      isFinishedAndEnabledAfterCompletion ||
      false;

    this.set({
      _isButtonVisible: isButtonVisible,
      _isButtonDisabled: !isButtonEnabled
    });
  }

}
