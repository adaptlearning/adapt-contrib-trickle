define([
    'coreJS/adapt', 
], function(Adapt) {

    var TrickleVisibilityHandler = _.extend({

        isStepLocking: false,

        trickleModel: null,

        initialize: function() {
            this.listenToOnce(Adapt, "app:dataReady", this.onAppDataReady);
        },

        onAppDataReady: function() {
            this.setupEventListeners();
        },

        setupEventListeners: function() {
            this.listenTo(Adapt, {
                "trickle:steplock": this.onStepLock,
                "trickle:visibility": this.onVisibility,
                "trickle:stepunlock": this.onStepUnlock,
                "trickle:kill": this.onKill,
                "trickle:finished": this.onFinished,
                "remove": this.onRemove
            });

        },

        onStepLock: function(view) {
            this.isStepLocking = true;
            this.trickleModel = view.model;
            _.defer(function() {
                Adapt.trigger("trickle:visibility");
            });
        },

        onVisibility: function() {
            if (!this.isStepLocking) return;

            if (!Adapt.trickle.pageView) return;

            var descendantsParentFirst = Adapt.trickle.pageView.descendantsParentFirst;

            var trickleModelId = this.trickleModel.get("_id");
            var atIndex = _.findIndex(descendantsParentFirst.models, function(descendant) {
                if (descendant.get("_id") === trickleModelId) return true;
            });

            descendantsParentFirst.each(function(descendant, index) {
                if (index <= atIndex) {
                    descendant.set("_isVisible", true, {pluginName:"trickle"});
                } else {
                    descendant.set("_isVisible", false, {pluginName:"trickle"});
                }
            });

        },

        onStepUnlock: function(view) {
            this.isStepLocking = false;
            this.trickleModel = null;
        },

        onKill: function() {
            this.onFinished();
            this.onStepUnlock();
        },

        onFinished: function() {

            var descendantsParentFirst = Adapt.trickle.pageView.descendantsParentFirst;

            descendantsParentFirst.each(function(descendant) {
                descendant.set("_isVisible", true, {pluginName:"trickle"});
            });

        },

        onRemove: function() {
            this.onStepUnlock();
        }

    }, Backbone.Events);

    TrickleVisibilityHandler.initialize();

    return TrickleVisibilityHandler;

});
