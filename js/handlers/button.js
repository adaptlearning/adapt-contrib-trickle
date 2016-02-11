define([
    'coreJS/adapt',
    './buttonView'
], function(Adapt, ButtonView) {

    var TrickleButtonHandler = _.extend({

        initialize: function() {
            this.listenToOnce(Adapt, "app:dataReady", this.onAppDataReady);
        },

        onAppDataReady: function() {
            this.setupEventListeners();
        },

        setupEventListeners: function() {
            this.listenTo(Adapt, {
                "trickle:postRender": this.onPostRender
            });
        },

        onPostRender: function(view) {
            if (!this.isTrickleEnabled(view.model)) return;

            this.setupConfigDefaults(view.model);

            view.$el.append(new ButtonView({
                model: view.model
            }).$el);
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

        }

    }, Backbone.Events);

    TrickleButtonHandler.initialize();

    return TrickleButtonHandler;
});
