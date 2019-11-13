define([
  'core/js/adapt',
  'core/js/views/componentView'
], function(Adapt, ComponentView) {

  var completionAttribute = "_isComplete";

  var TrickleButtonView = Backbone.View.extend({

    isStepLocking: false,
    hasStepLocked: false,
    isStepLocked: false,
    isStepLockFinished: false,
    hasStepPreCompleted: false,
    isWaitingForClick: false,
    allowVisible: false,
    allowEnabled: true,
    overlayShownCount: 0,

    el: function() {

      this.setupPreRender();

      return Handlebars.templates['trickle-button'](this.model.toJSON());
    },

    setupPreRender: function() {

      this.setupButtonVisible();
      this.setupButtonEnabled();
    },

    setupButtonVisible: function() {
      var trickle = Adapt.trickle.getModelConfig(this.model);
      this.allowVisible = false;
      trickle._button._isVisible = false;

      if (trickle._button._styleBeforeCompletion === "visible") {
        this.allowVisible = true;
        if (trickle._button._autoHide && trickle._button._isFullWidth) {
          trickle._button._isVisible = false;
        } else {
          trickle._button._isVisible = true;
        }
      }
    },

    setupButtonEnabled: function() {
      var trickle = Adapt.trickle.getModelConfig(this.model);

      if (trickle._stepLocking._isCompletionRequired === false) {
        this.allowEnabled = true;
        trickle._button._isDisabled = false;
      } else if (trickle._button._styleBeforeCompletion === "visible") {
        this.allowEnabled = false;
        trickle._button._isDisabled = true;
      } else {
        trickle._button._isDisabled = false;
        this.allowEnabled = true;
      }

    },

    events: {
      "click .js-trickle-btn": "onButtonClick"
    },

    initialize: function(options) {
      this.getCompletionAttribute();
      this.debounceCheckAutoHide();
      this.setupStepLocking();
      this.setupEventListeners();
    },

    getCompletionAttribute: function() {
      var trickle = Adapt.trickle.getModelConfig(Adapt.config);
      if (!trickle) return;
      if (!trickle._completionAttribute) return;
      completionAttribute = trickle._completionAttribute;
    },

    setupStepLocking: function() {
      var trickle = Adapt.trickle.getModelConfig(this.model);
      this.isStepLocked = Boolean(trickle._stepLocking._isEnabled);
    },

    setupEventListeners: function() {
      this.listenTo(Adapt, {
        "trickle:overlay": this.onOverlay,
        "trickle:unoverlay": this.onUnoverlay,
        "trickle:steplock": this.onStepLock,
        "trickle:stepunlock": this.onStepUnlock,
        "trickle:skip": this.onSkip,
        "trickle:kill": this.onKill,
        "trickle:update": this.onUpdate,
        "remove": this.onRemove
      });

      this.listenTo(this.model, "change:"+completionAttribute, this.onCompletion);
    },

    debounceCheckAutoHide: function() {
      this.checkButtonAutoHideSync = this.checkButtonAutoHide.bind(this);
      this.checkButtonAutoHide = _.debounce(this.checkButtonAutoHideSync, 100);
    },

    checkButtonAutoHide: function() {
      if (!this.allowVisible) {
        this.setButtonVisible(false);
        return;
      }

      var trickle = Adapt.trickle.getModelConfig(this.model);
      if (!trickle._button._autoHide) {
        this.setButtonVisible(true);
        return;
      } else if (this.overlayShownCount > 0) {
        this.setButtonVisible(false);
        return;
      }

      var measurements = this.$el.onscreen();

      // This is to fix common miscalculation issues
      var isJustOffscreen = (measurements.bottom > -100);

      // add show/hide animation here if needed
      if (measurements.onscreen || isJustOffscreen) {
        this.setButtonVisible(true);
      } else {
        this.setButtonVisible(false);
      }
    },

    setButtonVisible: function(isVisible) {
      var trickle = Adapt.trickle.getModelConfig(this.model);
      trickle._button._isVisible = Boolean(isVisible);
      this.$(".js-trickle-btn-container").toggleClass("u-display-none", !trickle._button._isVisible);
    },

    checkButtonEnabled: function() {
      this.setButtonEnabled(this.allowEnabled);
    },

    setButtonEnabled: function(isEnabled) {
      var trickle = Adapt.trickle.getModelConfig(this.model);
      var $button = this.$(".js-trickle-btn");
      if (isEnabled) {
        $button.removeClass("is-disabled").removeAttr("disabled");
        trickle._button._isDisabled = true;
        // move focus forward if it's on the aria-label
        if (document.activeElement && document.activeElement.isSameNode(this.$('.aria-label')[0])) {
          this.$('.aria-label').focusNext();
        }
        // make label unfocusable as it is no longer needed
        this.$('.aria-label').a11y_cntrl(false);
      } else {
        $button.addClass("is-disabled").attr("disabled", "disabled");
        trickle._button._isDisabled = false;
      }
    },

    onStepLock: function(view) {
      if (!this.isViewMatch(view)) return;

      this.hasStepLocked = true;
      this.isStepLocking = true;
      this.overlayShownCount = 0;

      var trickle = Adapt.trickle.getModelConfig(this.model);

      if (!this.isButtonEnabled()) return;
      var isCompleteAndShouldRelock = (trickle._stepLocking._isLockedOnRevisit &&
          this.model.get(completionAttribute));

      if (isCompleteAndShouldRelock) {
        this.isStepLocked = true;
        this.model.set("_isTrickleAutoScrollComplete", false);
        Adapt.trigger("trickle:wait");
        this.allowVisible = true;
        this.checkButtonAutoHide();
      } else if (this.hasStepPreCompleted) {
        // force the button to show if section completed before it was steplocked
        this.isStepLocked = true;
        this.model.set("_isTrickleAutoScrollComplete", false);
        this.allowVisible = true;
        this.stepCompleted();
      }
      this.setupOnScreenListener();
    },

    onOverlay: function() {
      this.overlayShownCount++;
    },

    onUnoverlay: function() {
      this.overlayShownCount--;
      this.checkButtonAutoHide();
    },

    setupOnScreenListener: function() {
      var trickle = Adapt.trickle.getModelConfig(this.model);

      if (!trickle._button._autoHide) return;
      this.$el.on("onscreen", this.checkButtonAutoHideSync);

    },

    isViewMatch: function(view) {
      return view.model.get("_id") === this.model.get("_id");
    },

    isButtonEnabled: function() {
      var trickle = Adapt.trickle.getModelConfig(this.model);

      if (!trickle._isEnabled || !trickle._button._isEnabled) return false;
      return true;
    },

    onCompletion: function(model, value) {
      if (value === false) return;

      this.hasStepPreCompleted = true;

      if (!this.hasStepLocked) return;

      this.stepCompleted();
    },

    stepCompleted: function() {

      if (this.isStepLockFinished) return;

      this.isStepLocked = false;
      this.allowVisible = false;
      this.allowEnabled = false;

      if (this.isButtonEnabled()) {
        if (this.isStepLocking) {

          this.isStepLocked = true;
          this.isWaitingForClick = true;
          Adapt.trigger("trickle:wait");

        } else {

          this.isStepLockFinished = true;
        }

        this.allowVisible = true;
        this.allowEnabled = true;
      }

      this.model.set("_isTrickleAutoScrollComplete", false);
      this.checkButtonAutoHideSync();
      this.checkButtonEnabled();

    },

    onButtonClick: function() {
      if (this.isStepLocked) {
        Adapt.trigger("trickle:unwait");
        this.isStepLocked = false;
        this.isStepLockFinished = true;
      } else {
        this.model.set("_isTrickleAutoScrollComplete", false);
        Adapt.trickle.scroll(this.model);
      }

      var trickle = this.model.get("_trickle");
      switch (trickle._button._styleAfterClick) {
      case "hidden":
        this.allowVisible = false;
        this.checkButtonAutoHideSync();
        break;
      case "disabled":
        this.allowEnabled = false;
        this.checkButtonAutoHideSync();
      }
    },

    onUpdate: function() {
      var trickle = Adapt.trickle.getModelConfig(this.model);

      if (trickle._button._autoHide && this.isStepLocking) {
        this.$el.off("onscreen", this.checkButtonAutoHideSync);
      }

      var $original = this.$el;
      var $newEl = $(Handlebars.templates['trickle-button'](this.model.toJSON()));
      $original.replaceWith($newEl);

      this.setElement($newEl);

      if (trickle._button._autoHide && this.isStepLocking) {
        this.$el.on("onscreen", this.checkButtonAutoHideSync);
      }
    },

    onStepUnlock: function(view) {
      if (!this.isViewMatch(view)) return;
      this.$el.off("onscreen", this.checkButtonAutoHideSync);
      this.isStepLocking = false;
      this.overlayShownCount = 0;
      // move focus forward if it's on the aria-label
      if (document.activeElement && document.activeElement.isSameNode(this.$('.aria-label')[0])) {
        this.$('.aria-label').focusNext();
      }
      // make label unfocusable as it is no longer needed
      this.$('.aria-label').a11y_cntrl(false);
    },

    onSkip: function() {
      if (!this.isStepLocking) return;

      this.onKill();
    },

    onKill: function() {
      this.$el.off("onscreen", this.checkButtonAutoHideSync);
      if (this.isWaitingForClick) {
        this.model.set("_isTrickleAutoScrollComplete", true);
      }
      this.isWaitingForClick = false;
      this.isStepLocked = false;
      this.isStepLocking = false;
      this.allowVisible = false;
      this.allowEnabled = false;
      this.isStepLockFinished = true;
      this.model.set("_isTrickleAutoScrollComplete", false);
      this.checkButtonAutoHide();
      this.checkButtonEnabled();
    },

    onRemove: function() {
      if (this.isWaitingForClick) {
        this.model.set("_isTrickleAutoScrollComplete", true);
      }
      this.isWaitingForClick = false;
      this.$el.off("onscreen", this.checkButtonAutoHideSync);
      this.isStepLocking = true;
      this.remove();
    }

  });

  return TrickleButtonView;

});
