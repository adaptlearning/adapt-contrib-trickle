define([
    'coreJS/adapt',
    'coreViews/componentView'
], function(Adapt, ComponentView) {

    var completionAttribute = "_isInteractionComplete";

    var TrickleButtonView = ComponentView.extend({

        onEnabledChange: function(model, value) {
            this.setDisabledState(!value);
        },

        onSteplockingCheckWait: function(parentModel) {
            this.checkCurrentInteraction(parentModel);
        },

        onInteractionRequired: function(parentModel) {
            this.showButton(parentModel); 
        },

        onOnScreen: function() {
            //show or hide the button when button is inview/outview
            this.checkAutoHide( this.isOnScreen() );
        },

        onClick: function() {
            if (!this.model.get("_isLocking")) {
                this.completeJump();
            } else {
                this.completeLock();
            }
        },

        onRemove: function() {
            this.undelegateEvents();
            this.$el.remove();
        },

        events: {
            "click .trickle-button-inner > *": "onClick",
            "onscreen": "onOnScreen"
        },

        _isTrickleWaiting: false,

        initialize: function() {
            var trickleConfig = Adapt.config.get("_trickle");
            if (trickleConfig && trickleConfig._completionAttribute) completionAttribute = trickleConfig._completionAttribute;

            this.addCustomClasses();
            ComponentView.prototype.initialize.apply(this);

            this.model.set("_isEnabled", this.isInEnabledState());

            this.checkAutoHide(this.isInVisibleState(), false);
        },

        addCustomClasses: function() {
            if (!this.model.get("_trickle")._button || !this.model.get("_trickle")._button._className) return;
            
            this.$el.addClass(this.model.get("_trickle")._button._className);
        },

        postRender: function() {
            this.setDisabledState( !this.isInEnabledState() );

            this.setReadyStatus();
            this.setupEventListeners();
        },

        setDisabledState: function(bool) {
            if (bool) this.$el.find(".trickle-button-inner > *").addClass("disabled").attr("disabled","disabled");
            else this.$el.find(".trickle-button-inner > *").removeClass("disabled").removeAttr("disabled");
        },

        setupEventListeners: function() {

            var trickleConfig = this.model.get("_trickle");
            if (!trickleConfig._button._autoHide) this.$el.off("onscreen");

            this.listenTo(Adapt, "trickle:interactionRequired", this.onInteractionRequired);
            this.listenTo(Adapt, "steplocking:waitCheck", this.onSteplockingCheckWait);
            this.listenTo(this.model, "change:_isEnabled", this.onEnabledChange);
            this.listenTo(this.model, "change:_isVisible", this.onVisibilityChange);
            this.listenToOnce(Adapt, "remove", this.onRemove);
            this.listenToOnce(Adapt, "trickle:kill", this.onRemove);
        },

        toggleLock: function(bool) {
            if (!this.isStepLockingEnabled()) return;

            var trickleConfig = this.model.get("_trickle");

            if (bool) {

                this.$el.find('.component-inner').addClass("locking");

                this.model.set("_isLocking", true);

                this.steplockingWait();

            } else {

                this.$el.find('.component-inner').removeClass("locking");

                this.model.set("_isLocking", false);

                this.steplockingUnwait();
            }
        },

        isStepLockingEnabled: function() {
            var trickleConfig = this.model.get("_trickle");
            if (trickleConfig && trickleConfig._stepLocking && trickleConfig._stepLocking._isEnabled) {
                return true;
            }
            return false;
        },

        steplockingWait: function() {
            if (!this._isTrickleWaiting) Adapt.trigger("steplocking:wait");
            this._isTrickleWaiting = true;
        },

        steplockingUnwait: function() {
            if (this._isTrickleWaiting) Adapt.trigger("steplocking:unwait");
            this._isTrickleWaiting = false;
        },

        checkCurrentInteraction: function(parentModel) {
            if (parentModel.get("_id") != this.model.get("_parentId")) return;

            var trickleConfig = this.model.get("_trickle");

            if (trickleConfig._isInteractionComplete) return;

            this.model.set("_isEnabled", this.isInEnabledState() );
        },

        showButton: function(parentModel) {
            //check if the interaction required event is intended for this button
            if (parentModel.get("_id") != this.model.get("_parentId")) return;

            var trickleConfig = this.model.get("_trickle");

            if (trickleConfig._isInteractionComplete) return;

            this.model.set("_isEnabled",  this.isInEnabledState() );

            this.toggleLock(true);

            this.checkAutoHide(true, true);
        },

        checkAutoHide: function(bool, animate) {
            
            if (!this.isInVisibleState()) {
                //override visible state if button should not be visible
                bool = false;
            }

            this.model.set("_isVisible", bool);

            var trickleConfig = this.model.get("_trickle");
            if (!trickleConfig._button._autoHide) return;

            if (this.model.get("_isHidden") == bool) return;

            this.model.set("_isHidden", bool);

            if (animate === false || Adapt.config.get('_disableAnimation')) {
                //show or hide without animations
                if (!bool) this.$('.component-inner').css("visibility", "hidden");
                else if (bool) this.$('.component-inner').css("visibility", "visible");
            } else {
                //perform animation from visible<>hidden
                if (bool) this.$('.component-inner').css("visibility", "visible");
                this.$('.component-inner').velocity("stop", true).velocity({opacity: bool ? 1 : 0 }, {
                    duration: 250,
                    complete: _.bind(function() {
                        if (!bool) this.$('.component-inner').css("visibility", "hidden");
                    }, this)
                })
            }
            
        },

        isInEnabledState: function() {
            var trickleConfig = this.model.get("_trickle");

            var _isEnabled = true;

            var isEnabledBeforeCompletion = false;
            //Check to see if autohide component should always be visible or if it has a precompletion hidden state
            if (trickleConfig._button._styleBeforeCompletion == "visible") {
                isEnabledBeforeCompletion = (!trickleConfig._stepLocking._isEnabled || !trickleConfig._stepLocking._isCompletionRequired);
            }

            var isEnabledAfterClick = (trickleConfig._button._styleAfterClick != "hidden" && trickleConfig._button._styleAfterClick != "disabled");

            var parentModel = Adapt.findById(this.model.get("_parentId"));
            var isComplete = parentModel.get(completionAttribute);
            var isClicked = trickleConfig._isInteractionComplete;

            var isBeforeCompletionEnabled = (!isComplete && !isClicked && isEnabledBeforeCompletion);
            var isAfterCompletionEnabled = (isClicked && isEnabledAfterClick);
            var isInInteractionEnabled = (isComplete && !isClicked);

            _isEnabled = isBeforeCompletionEnabled || isAfterCompletionEnabled || isInInteractionEnabled;

            return _isEnabled;
        },

        isInVisibleState: function() {
            var trickleConfig = this.model.get("_trickle");

            var _isVisible = true;

            var isVisibleBeforeCompletion = true;
            //Check to see if autohide component should always be visible or if it has a precompletion hidden state
            if (trickleConfig._button._styleBeforeCompletion == "hidden") {
                isVisibleBeforeCompletion = (trickleConfig._button._styleBeforeCompletion != "hidden");
            }

            var isVisibleAfterClick = (trickleConfig._button._styleAfterClick != "hidden");

            var parentModel = Adapt.findById(this.model.get("_parentId"));
            var isComplete = parentModel.get(completionAttribute);
            var isClicked = trickleConfig._isInteractionComplete;

            var isOnScreen = true;
            if (trickleConfig._button._autoHide) {
                isOnScreen = this.isOnScreen();
            }

            var isBeforeCompletionVisible = (!isComplete && !isClicked && isVisibleBeforeCompletion && isOnScreen);
            var isInInteractionVisible = (isComplete && !isClicked && isOnScreen);
            var isAfterCompletionVisible = (isClicked && isVisibleAfterClick && isOnScreen);

            _isVisible = isBeforeCompletionVisible || isAfterCompletionVisible || isInInteractionVisible;


            return _isVisible;

        },

        isOnScreen: function() {
            var onscreen = false;
            var measurements = this.$el.onscreen();
            var parent = this.$el.offsetParent();
            var isParentHtml = parent.is("html");
            if (!isParentHtml && measurements.bottom > -(this.$(".component-inner").outerHeight()*2)) {
                onscreen = true;
            }
            return onscreen;
        },

        completeJump: function() {

            var trickleConfig = this.model.get("_trickle");
            trickleConfig._isInteractionComplete = true;

            this.updateState();

            this.scrollTo();
        },

        updateState: function() {

            var trickleConfig = this.model.get("_trickle");

            switch (trickleConfig._button._styleAfterClick) {
            case "disabled": case "hidden":
                this.model.set("_isEnabled", this.isInEnabledState() );
                this.$el.off("onscreen");
                this.stopListening();
                break;
            case "scroll":
                this.model.set("_isEnabled", this.isInEnabledState() );
                break;
            }

            this.checkAutoHide(true, true);
        },

        scrollTo: function() {
            var trickleConfig = this.model.get("_trickle");
            var scrollTo = trickleConfig._scrollTo;
            var parentModel = Adapt.findById(this.model.get("_parentId"));
            Adapt.trigger("trickle:relativeScrollTo", parentModel, scrollTo);
        },

        completeLock: function() {

            var trickleConfig = this.model.get("_trickle");
            trickleConfig._isInteractionComplete = true;

            this.toggleLock(false);

            //as this is an 'out-of-course' component, 
            //we must manually ask trickle to consider the completion of its parent (possibly for a second time)
            var parentModel = Adapt.findById(this.model.get("_parentId"));
            Adapt.trigger("trickle:interactionComplete", parentModel);
            
            this.updateState();
        }

    });

    Adapt.register("trickle-button", TrickleButtonView);

    return TrickleButtonView;
});
