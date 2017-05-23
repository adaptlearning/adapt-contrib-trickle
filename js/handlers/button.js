define([
    'core/js/adapt',
    './buttonView'
], function(Adapt, ButtonView) {

    var TrickleButtonHandler = _.extend({

        buttonViews: null,

        initialize: function() {
            this.listenToOnce(Adapt, {
                "app:dataReady": this.onAppDataReady,
                "remove": this.onRemove
            });
        },

        onAppDataReady: function() {
            this.buttonViews = {};
            this.setupEventListeners();
        },

        setupEventListeners: function() {
            this.listenTo(Adapt, {
                "trickle:preRender": this.onPreRender,
                "trickle:postRender": this.onPostRender
            });
        },

        onPreRender: function(view) {
            //setup button on prerender to allow it to control the steplocking process
            if (!this.isTrickleEnabled(view.model)) return;

            this.setupConfigDefaults(view.model);

            this.buttonViews[view.model.get("_id")] = new ButtonView({
                model: view.model
            });
        },

        onPostRender: function(view) {
            //inject the button at post render
            if (!this.isTrickleEnabled(view.model)) return;

            view.$el.append(this.buttonViews[view.model.get("_id")].$el);
        },

        isTrickleEnabled: function(model) {
            var trickle = Adapt.trickle.getModelConfig(model);
            if (!trickle || !trickle._isEnabled) return false;

            if (trickle._onChildren && model.get("_type") === "article") return false;

            return true;
        },

        setupConfigDefaults: function(model) {
            if (model.get("_isTrickleButtonConfigured")) return;

            var trickle = Adapt.trickle.getModelConfig(model);
            trickle._button = _.extend({
                "_isEnabled": true, //(default=true)
                "_styleBeforeCompletion": "hidden", //(default=hidden)
                "_styleAfterClick": "hidden", //(default=hidden)
                "_isFullWidth": true, //(default=true)
                "_autoHide": true, //(default=true)
                "_className": "", //(default="")
                "text": "Continue", //(default="Continue")
                "startText": "Begin", //(default="Begin")
                "finalText": "Finish", //(default="Finish")
                "_component": "trickle-button", //(default="trickle-button")
                "_isLocking": true,
                "_isVisible": false,
                "_isDisabled": false
            }, trickle._button);


            if (trickle._button._isFullWidth) {
                trickle._stepLocking._isEnabled = true;
                trickle._button._styleAfterClick = "hidden";
            } else {
                trickle._button._autoHide = false;
            }

            Adapt.trickle.setModelConfig(model, trickle);
            model.set("_isTrickleButtonConfigured", true);

        },

        onRemove: function() {
            this.buttonViews = {};
        }

    }, Backbone.Events);

    TrickleButtonHandler.initialize();

    return TrickleButtonHandler;
});
