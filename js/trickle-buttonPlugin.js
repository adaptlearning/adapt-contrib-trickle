define([
    'coreJS/adapt',
    './trickle-buttonView',
    './trickle-buttonModel'
], function(Adapt, TrickleButtonView, TrickleButtonModel) {

    var completionAttribute = "_isInteractionComplete";

    var TrickleButtonPlugin = {
        
        onInteractionInitialize: function(model) {
            var trickleConfig = Adapt.config.get("_trickle");
            if (trickleConfig && trickleConfig._completionAttribute) completionAttribute = trickleConfig._completionAttribute;

            TrickleButtonPlugin.createButton(model);
        },

        createButton: function(model) {
            var trickleConfig = model.get("_trickle");
            if (!trickleConfig) return false;

            if (!TrickleButtonPlugin.shouldRenderButton(model, trickleConfig)) return;
            TrickleButtonPlugin.buildAndAppendButton(model, trickleConfig);
        },

        shouldRenderButton: function(model, trickleConfig) {
            if (!trickleConfig._button._isEnabled) return false;
            if (!trickleConfig._button._component == "trickle-button") return false;

            return true;
        },

        buildAndAppendButton: function(model, trickleConfig) {
            var $containerModelElement = $("." + trickleConfig._id);

            var buttonModel = new TrickleButtonModel({ 
                trickleConfig: trickleConfig, 
                parentModel: model 
            });

            var buttonView = new TrickleButtonView({ 
                model: buttonModel, 
                nthChild: "additional" 
            });

            $containerModelElement.append( buttonView.$el );
        }
    };

    Adapt.on("trickle:interactionInitialize", TrickleButtonPlugin.onInteractionInitialize);

    return TrickleButtonPlugin;
});