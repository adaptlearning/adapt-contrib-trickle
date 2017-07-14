define([
    'core/js/adapt'
], function(Adapt) {

    var TrickleTutorHandler = _.extend({

        stepLockedId: null,
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
            if (view) {
                this.stepLockedId = view.model.get("_id");
            }
            this.isStepLocking = true;
        },

        onTutorOpened: function(view, alertObject) {
            if (!this.isStepLocking) return;
            if (!this.isOriginStepLocked(view)) return;

            this.isTutorOpen = true;
            Adapt.trigger("trickle:overlay");
            Adapt.trigger("trickle:wait");
        },

        isOriginStepLocked: function(view) {
            if (!view || !this.stepLockedId) return true;

            var parents = view.model.getAncestorModels();
            var hasStepLockedParent = _.find(parents, function(ancestor) {
                return ancestor.get('_id') === this.stepLockedId;
            }, this);
            if (!hasStepLockedParent) return false;
            return true;
        },

        onTutorClosed: function(view, alertObject) {
            if (!this.isStepLocking) return;
            if (!this.isTutorOpen) return;
            if (!this.isOriginStepLocked(view)) return;

            this.isTutorOpen = false;
            Adapt.trigger("trickle:unoverlay");
            Adapt.trigger("trickle:unwait");
        },

        onStepUnlock: function() {
            this.isStepLocking = false;
            this.stepLockedId = null;
        },

        onRemove: function() {
            this.onStepUnlock();
        }

    }, Backbone.Events);

    TrickleTutorHandler.initialize();

    return TrickleTutorHandler;

});
