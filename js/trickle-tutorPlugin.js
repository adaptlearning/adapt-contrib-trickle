define([
    'coreJS/adapt', 
], function(Adapt) {

    var TrickleTutorPlugin = _.extend({

        onDataReady: function() {
            this.setupEventListeners();
        },

        onStepLockingWaitCheck: function(model) {
            if ( model.get("_type") !== "component" || !model.get("_isQuestionType") || !model.get("_canShowFeedback")) return;

            if (this._isTrickleWaiting) return;
            Adapt.trigger("steplocking:wait");
            this._isTrickleWaiting = true;
        },

        onTutorOpened: function() {
            if (this._isTrickleWaiting) return;
            Adapt.trigger("steplocking:wait");
        },

        onTutorClosed: function() {

            if (!this._isTrickleWaiting) return;

            Adapt.trigger("steplocking:unwait");
            this._isTrickleWaiting = false;
        },

        _isTrickleWaiting: false,

        initialize: function() {
            this.listenToOnce(Adapt, "app:dataReady", this.onDataReady);
        },

        setupEventListeners: function() {
            this.listenTo(Adapt, "steplocking:waitCheck", this.onStepLockingWaitCheck);
            this.listenTo(Adapt, "tutor:open", this.onTutorOpened);
            this.listenTo(Adapt, "tutor:closed", this.onTutorClosed);
        }

    }, Backbone.Events);

    TrickleTutorPlugin.initialize();

})
