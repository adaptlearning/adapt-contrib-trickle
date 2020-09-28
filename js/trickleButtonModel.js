define([
  'core/js/adapt',
  'core/js/models/componentModel'
], function(Adapt, ComponentModel) {

  class TrickleButtonModel extends ComponentModel {

    /**
     * Returns true if the button is enabled in its trickle configuration
     * @returns {boolean}
     */
    isEnabled() {
      const trickle = Adapt.trickle.getModelConfig(this);
      const isEnabled = (trickle._isEnabled && trickle._button && trickle._button._isEnabled);
      return isEnabled;
    }

    /**
     * Returns true if page truncation (step locking) is active
     * @return {boolean}
     */
    isStepLocking() {
      const config = Adapt.trickle.getModelConfig(this);
      const isStepLocking = config._stepLocking &&
        config._stepLocking._isEnabled;
      return isStepLocking;
    }

    /**
     * Returns true if completion is required to unlock this step
     * @return {boolean}
     */
    isStepLockingCompletionRequired() {
      const config = Adapt.trickle.getModelConfig(this);
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
      const completionAttribute = Adapt.trickle.getCompletionAttribute();
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
      const trickleConfig = Adapt.trickle.getModelConfig(this);
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
     * Calculate and apply start and final position flags within the current siblings.
     * Siblings in assessments can be randomised so this must be derived at runtime.
     */
    calculateButtonPosition() {
      const siteId = this.get('_trickleConfigId');
      const trickleConfig = Adapt.trickle.getModelConfig(Adapt.findById(siteId));
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

      const isTrickleKilled = Adapt.trickle.isKilled;

      const isStepUnlocked = this.isStepUnlocked() || isTrickleKilled;
      const isFinished = this.isFinished() || isTrickleKilled;
      const trickle = Adapt.trickle.getModelConfig(this);

      const isButtonVisibleBeforeCompletion = (trickle._button._styleBeforeCompletion !== 'hidden');
      // Force button to be hidden after completion if _isFullWidth, otherwise absolutely positioned buttons will stack
      const isButtonVisibleAfterCompletion = (trickle._button._styleAfterClick !== 'hidden') && !trickle._button._isFullWidth;

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

      const isButtonEnabledBeforeCompletion = (trickle._button._styleBeforeCompletion !== 'disabled');
      const isButtonEnabledAfterCompletion = (trickle._button._styleAfterClick !== 'disabled');

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

  return TrickleButtonModel;

});
