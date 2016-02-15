define([
    'coreJS/adapt', 
], function(Adapt) {

    var TrickleTutorHandler = _.extend({

        isStepLocking: false,
        isTutorOpen: false,

        initialize: function() {
            this.listenToOnce(Adapt, "app:dataReady", this.onAppDataReady);
        },

        onAppDataReady: function() {
            this.setupEventListeners();
        },

        setupEventListeners: function() {
            this.listenTo(Adapt, {
                "trickle:steplock": this.onStepLock,
                "tutor:opened": this.onTutorOpened,
                "tutor:closed": this.onTutorClosed,
                "trickle:stepunlock": this.onStepUnlock,
                "remove": this.onRemove
            });
        },

        onStepLock: function(view) {
            this.isStepLocking = true;
        },

        onTutorOpened: function() {
            if (!this.isStepLocking) return;

            this.isTutorOpen = true;
            Adapt.trigger("trickle:overlay");
            Adapt.trigger("trickle:wait");
        },

        onTutorClosed: function() {
            if (!this.isStepLocking) return;
            if (!this.isTutorOpen) return;

            this.isTutorOpen = false;
            Adapt.trigger("trickle:unoverlay");
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
