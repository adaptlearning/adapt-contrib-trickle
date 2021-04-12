import Adapt from 'core/js/adapt';
import controller from './controller';
import ComponentModel from 'core/js/models/componentModel';
import {
  getModelConfig,
  getCompletionAttribute
} from './models';

export default class TrickleButtonModel extends ComponentModel {

  /**
   * @returns {boolean} true if the button is enabled in its trickle configuration
   */
  isEnabled() {
    const trickleConfig = getModelConfig(this);
    const isEnabled = trickleConfig._isEnabled &&
      trickleConfig._button &&
      trickleConfig._button._isEnabled;
    return isEnabled;
  }

  /**
   * @return {boolean} true if page truncation (step locking) is active
   */
  isStepLocking() {
    const config = getModelConfig(this);
    const isStepLocking = config._stepLocking &&
      config._stepLocking._isEnabled;
    return isStepLocking;
  }

  /**
   * @return {boolean} true if completion is required to unlock this step
   */
  isStepLockingCompletionRequired() {
    const config = getModelConfig(this);
    const isStepLockingCompletionRequired = config._stepLocking &&
      config._stepLocking._isEnabled &&
      config._stepLocking._isCompletionRequired;
    return isStepLockingCompletionRequired;
  }

  /**
   * Returns true if all available siblings are complete, optional or not available
   * @returns {boolean}
   */
  isStepUnlocked() {
    const completionAttribute = getCompletionAttribute();
    return !(this.getSiblings().find(sibling => {
      if (sibling === this) {
        return;
      }
      return !sibling.get(completionAttribute) &&
        !sibling.get('_isOptional') &&
        sibling.get('_isAvailable');
    }));
  }

  /**
   * Returns true if this button should always be locked on revisit
   * @returns {boolean}
   */
  isStepLockedOnRevisit() {
    const trickleConfig = getModelConfig(this);
    return Boolean(trickleConfig._stepLocking._isLockedOnRevisit);
  }

  /**
   * Returns true if completion is not required or if completion has been fullfilled
   * and the button has been clicked
   * @return {boolean}
   */
  isFinished() {
    const isStepUnlocked = this.isStepUnlocked();
    const isStepLockingCompletionRequired = this.isStepLockingCompletionRequired();
    const isButtonComplete = this.get('_isComplete');
    const isFinished = ((isStepUnlocked || !isStepLockingCompletionRequired) && isButtonComplete);
    return isFinished;
  }

  /**
   * Apply start and final text amongst the current siblings
   * Siblings in assessments can be randomised so this must be derived at runtime
   */
  calculateButtonText() {
    const siteId = this.get('_trickleConfigId');
    const trickleConfig = getModelConfig(Adapt.findById(siteId));
    let isStart = false;
    let isFinal = false;
    if (trickleConfig._onChildren) {
      const parentId = this.getParent().get('_id');
      const trickleParent = Adapt.findById(siteId);
      const trickleSiblings = trickleParent.getAllDescendantModels(true).filter(model => {
        return model.get('_isAvailable') && model.get('_isTrickled') && model.get('_trickleConfigId') === siteId;
      });
      const index = trickleSiblings.findIndex(model => model.get('_id') === parentId);
      isStart = (index === 0);
      isFinal = (index === trickleSiblings.length - 1 && !trickleParent.get('_canRequestChild'));
    }
    const text = (isStart && trickleConfig._button.startText) ?
      trickleConfig._button.startText :
      (isFinal && trickleConfig._button.finalText) ?
        trickleConfig._button.finalText :
        trickleConfig._button.text;
    const ariaLabel = (isStart && trickleConfig._button.startAriaLabel) ?
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
    if (this.isStepUnlocked() && !this.isStepLockedOnRevisit()) return;
    this.set({
      _isComplete: false,
      _isInteractionComplete: false
    });
  }

  /**
   * Calculate the current button visible and enabled states
   * @param {boolean} isButtonDisableForced Set to true to signify that the button must not be enabled
   */
  calculateButtonState(isButtonDisableForced = false) {
    if (!this.isEnabled()) {
      this.set({
        _isButtonVisible: false,
        _isButtonDisabled: true
      });
      return;
    };

    const isTrickleKilled = controller.isKilled;

    const isStepUnlocked = this.isStepUnlocked() || isTrickleKilled;
    const isFinished = this.isFinished() || isTrickleKilled;
    const trickleConfig = getModelConfig(this);

    const isButtonVisibleBeforeCompletion = (trickleConfig._button._styleBeforeCompletion !== 'hidden');
    // Force button to be hidden after completion if _isFullWidth, otherwise absolutely positioned buttons will stack
    const isButtonVisibleAfterCompletion = (trickleConfig._button._styleAfterClick !== 'hidden') && !trickleConfig._button._isFullWidth;

    const isStepLockingCompletionRequired = this.isStepLockingCompletionRequired();

    const isNoCompletionRequiredAndLockedVisible = (!isStepLockingCompletionRequired && !isFinished && isButtonVisibleBeforeCompletion);
    const isNoCompletionRequiredAndUnlockedVisible = (!isStepLockingCompletionRequired && isStepUnlocked && !isFinished);
    const isNoCompletionRequiredAndFinishedVisible = (!isStepLockingCompletionRequired && isFinished && isButtonVisibleAfterCompletion);
    const isStepLockedAndVisibleBeforeCompletion = (isStepLockingCompletionRequired && !isStepUnlocked && isButtonVisibleBeforeCompletion);
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
