define([
  'core/js/adapt',
  './trickleButtonView',
  './trickleButtonModel'
], function(Adapt, TrickleButtonView, TrickleButtonModel) {

  Adapt.register('trickle-button', {
    view: TrickleButtonView,
    model: TrickleButtonModel
  });

});
