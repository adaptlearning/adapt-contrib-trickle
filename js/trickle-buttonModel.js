define([
    'coreModels/adaptModel',
    './Defaults/FullWidthButtonConstants'
], function(AdaptModel, FullWidthButtonConstants) {

    var TrickleButtonModel = AdaptModel.extend({
        
        initialize: function(options) {
            if (options.trickleConfig === undefined) return;
            if (options.parentModel === undefined) return;

            var parentModel = options.parentModel;
            var trickleConfig = options.trickleConfig;

            var isFullWidth = (trickleConfig._button._isFullWidth);
            if (isFullWidth) {
                //setup configuration with FullWidth type constants
                $.extend(true, trickleConfig, FullWidthButtonConstants);
            }

            this.setupButtonText(trickleConfig);

            this.set({
                _id: "trickle-button-"+parentModel.get("_id"),
                _type: "component",
                _component: "trickle-button",
                //turn off accessibility state for button component
                _classes: "no-state" + (isFullWidth ? " trickle-full-width" : ""),
                _layout: "full",
                _parentId: parentModel.get("_id"),
                _parentType: parentModel.get("_type"),
                _parentComponent: parentModel.get("_component"),
                _trickle: trickleConfig,
                _isVisible: true,
                _isHidden: false,
                _isAvailable: true,
                _isEnabled: true,
                _isLocking: trickleConfig._isLocking,
                _isComplete: trickleConfig._isInteractionComplete,
                _isInteractionComplete: trickleConfig._isInteractionComplete,
                _index: trickleConfig._index
            });

        },

        setupButtonText: function(trickleConfig) {
            if (trickleConfig._isLastItem) {
                //Apply final text to last button
                if (trickleConfig._button && trickleConfig._button.finalText) {
                    var previousText = trickleConfig._button.text;

                    trickleConfig._button.text = trickleConfig._button.finalText,
                    trickleConfig._button.previousText = previousText;
                }
            } else {
                //Reset button to previous text
                if (trickleConfig && trickleConfig._button.previousText) {
                    trickleConfig._button.text = trickleConfig._button.previousText;
                    trickleConfig._button.previousText = null;
                }
            }
        }

    });

    return TrickleButtonModel;

});