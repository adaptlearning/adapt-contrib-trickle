define([
    'core/js/adapt'
], function(Adapt) {

    var completionAttribute = "_isComplete";

    var TrickleCompletionHandler = _.extend({

        isStepLocking: false,
        isCompleted: false,
        
        stepModel: null,
        
        initialize: function() {
            this.listenToOnce(Adapt, "app:dataReady", this.onAppDataReady);
        },

        onAppDataReady: function() {
            this.getCompletionAttribute();
            this.setupEventListeners();
        },

        getCompletionAttribute: function() {
            var trickle = Adapt.trickle.getModelConfig(Adapt.config);
            if (!trickle) return;
            if (trickle._completionAttribute) {
                completionAttribute = trickle._completionAttribute;
            }
        },

        setupEventListeners: function() {
            this.listenTo(Adapt, {
                "trickle:descendants": this.onDescendants,
                "trickle:steplock": this.onStepLock,
                "trickle:stepunlock": this.onStepUnlock,
                "trickle:kill": this.onKill,
                "remove": this.onRemove
            });
        },

        onDescendants: function(view) {
            //save the original completion state of the component before steplocking
            _.each(view.descendantsParentFirst, _.bind(function(descendant) {
                var trickle = Adapt.trickle.getModelConfig(descendant);
                if (!trickle) return;
                trickle._wasCompletedPreRender = descendant.get(completionAttribute);
            }, this));
        },

        onStepLock: function(view) {
            var isModelComplete = view.model.get(completionAttribute);

            var trickle = Adapt.trickle.getModelConfig(view.model);
            if (!trickle._stepLocking._isCompletionRequired
                && !trickle._stepLocking._isLockedOnRevisit) {
                if (isModelComplete) {
                    //skip any components that do not require completion but that are already complete
                    //this is needed for a second visit to a page with 'inview' components that aren't reset and don't require completion and are not relocked on revisit
                    Adapt.trigger("trickle:continue", view);
                }
                return;
            }

            if (trickle._stepLocking._isCompletionRequired
                && isModelComplete
                && trickle._wasCompletedPreRender) {
                //skip any components that are complete, have require completion and we completed before the page rendered
                Adapt.trigger("trickle:continue", view);
                return;
            }

            Adapt.trigger("trickle:wait");

            if (isModelComplete) {
                _.defer(function() {
                    Adapt.trigger("trickle:unwait");
                });
                return;
            }

            view.model.set("_isTrickleAutoScrollComplete", false);
            this.isCompleted = false;
            this.isStepLocking = true;
            this.stepModel = view.model;

            this.listenTo(this.stepModel, "change:"+completionAttribute, this.onCompletion);
        },

        onCompletion: function(model, value) {
            if (value === false) return;

            _.defer(_.bind(function() {
                this.stepCompleted();
            }, this));

        },

        stepCompleted: function() {

            if (!this.isStepLocking) return;

            if (this.isCompleted) return;
            this.isCompleted = true;

            this.stopListening(this.stepModel, "change:"+completionAttribute, this.onCompletion);
            
            _.defer(function(){
                Adapt.trigger("trickle:unwait");
            });
        },

        onKill: function() {
            this.onStepUnlock();
        },

        onRemove: function() {
            this.onStepUnlock();
        },

        onStepUnlock: function() {
            this.stopListening(this.stepModel, "change:"+completionAttribute, this.onCompletion);
            this.isStepLocking = false;
            this.stepModel = null;
            this.isCompleted = false;
        }        

    }, Backbone.Events);

    TrickleCompletionHandler.initialize();

    return TrickleCompletionHandler;

});
