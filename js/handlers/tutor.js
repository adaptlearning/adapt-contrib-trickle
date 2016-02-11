define([
    'coreJS/adapt', 
], function(Adapt) {

    var TrickleTutorHandler = _.extend({

        isStepLocking: false,

        initialize: function() {
            this.listenToOnce(Adapt, "app:dataReady", this.onAppDataReady);
        },

        onAppDataReady: function() {
            this.setupEventListeners();
        },

        setupEventListeners: function() {
            this.listenTo(Adapt, {
                "trickle:steplock": this.onStepLock,
                "tutor:open": this.onTutorOpened,
                "tutor:closed": this.onTutorClosed,
                "trickle:stepunlock": this.onStepUnlock,
                "remove": this.onRemove
            });
        },

        onStepLock: function() {
            this.isStepLocking = true;
        },

        onTutorOpened: function() {
            if (this.isStepLocking) return;
            Adapt.trigger("trickle:wait");
        },

        onTutorClosed: function() {
            if (!this.isStepLocking) return;

            Adapt.trigger("trickle:unwait");
        },

        onStepUnlock: function() {
            this.isStepLocking = false;
        },

        onRemove: function() {
            this.onStepUnlock();
        }

    }, Backbone.Events);

    TrickleTutorHandler.initialize();

    return TrickleTutorHandler;

});
