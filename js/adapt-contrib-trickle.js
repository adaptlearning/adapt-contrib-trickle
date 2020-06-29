define([
  'core/js/adapt',
  './pageView',
  './handlers/button',
  './handlers/completion',
  './handlers/notify',
  './handlers/resize',
  './handlers/tutor',
  './handlers/visibility',
  './handlers/done'
], function(Adapt, PageView) {

  var Trickle = Backbone.Controller.extend({

    model: null,
    pageView: null,

    initialize: function() {
      this.listenToOnce(Adapt, {
        'app:dataReady': this.onAppDataReady
      });
    },

    onAppDataReady: function() {
      this.getCourseModel();
      if (!this.isCourseEnabled()) return;
      this.setupListeners();
    },

    getCourseModel: function() {
      this.model = Adapt.course;
    },

    isCourseEnabled: function() {
      var trickleConfig = this.getModelConfig(this.model);
      if (trickleConfig && trickleConfig._isEnabled === false) return false;
      return true;
    },

    getModelConfig: function(model) {
      return model.get('_trickle');
    },

    getCompletionAttribute: function() {
      var trickle = this.getModelConfig(Adapt.config);
      if (!trickle) return '_isComplete';
      return trickle._completionAttribute || '_isComplete';
    },

    setModelConfig: function(model, config) {
      return model.set('_trickle', config);
    },

    setupListeners: function() {
      this.listenTo(Adapt, 'pageView:preRender', this.onPagePreRender);
    },

    onPagePreRender: function(view) {
      this.pageView = new PageView({
        model: view.model,
        el: view.el
      });
    },

    scroll: function(fromModel) {
      // Wait for model visibility to handle

      if (!this.shouldScrollPage(fromModel)) return;

      fromModel.set('_isTrickleAutoScrollComplete', true);

      var trickle = Adapt.trickle.getModelConfig(fromModel);
      var isAutoScrollOff = !trickle._autoScroll;
      var hasTrickleButton = trickle._button._isEnabled;
      if (isAutoScrollOff && !hasTrickleButton) {
        return;
      }

      var scrollTo = trickle._scrollTo;
      if (scrollTo === undefined) scrollTo = '@block +1';

      var scrollToId = '';
      switch (scrollTo.substr(0,1)) {
        case '@':
          // NAVIGATE BY RELATIVE TYPE

          // Allows trickle to scroll to a sibling / cousin component
          // relative to the current trickle item
          var relativeModel = fromModel.findRelativeModel(scrollTo, {
            filter: function(model) {
              return model.get('_isAvailable');
            }
          });

          if (relativeModel === undefined) return;
          scrollToId = relativeModel.get('_id');
          break;
        case '.':
          // NAVIGATE BY CLASS
          scrollToId = scrollTo.substr(1, scrollTo.length-1);
          break;
        default:
          scrollToId = scrollTo;
      }

      if (scrollToId === '') return;

      if (hasTrickleButton) { // only set focus if there's a trickle button - see https://github.com/adaptlearning/adapt_framework/issues/2813
        Adapt.a11y.focusFirst($('.' + scrollToId));
      }

      if (isAutoScrollOff) return;

      var duration = fromModel.get('_trickle')._scrollDuration || 500;
      Adapt.scrollTo('.' + scrollToId, { duration: duration });
    },

    shouldScrollPage: function(fromModel) {
      var trickle = Adapt.trickle.getModelConfig(fromModel);
      if (!trickle || !trickle._isEnabled) return false;

      var hasScrolled = fromModel.get('_isTrickleAutoScrollComplete');
      if (hasScrolled) return false;

      var isArticleWithOnChildren = (fromModel.get('_type') === 'article' && trickle._onChildren);
      if (isArticleWithOnChildren) return false;

      return true;
    }

  });

  return (Adapt.trickle = new Trickle());

});
