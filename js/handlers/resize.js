define([
  'core/js/adapt'
], function(Adapt) {

  var TrickleBodyResizeHandler = Backbone.Controller.extend({

    isStepLocking: false,

    stepView: null,

    initialize: function() {
      this.listenToOnce(Adapt, {
        "app:dataReady": this.onAppDataReady,
        "adapt:initialize": this.onAdaptInitialized
      });
    },

    onAppDataReady: function() {
      this.onResize = this.onResize.bind(this);
      this.preventWrapperScroll = this.preventWrapperScroll.bind(this);
      this.setupEventListeners();
    },

    setupEventListeners: function() {
      this.listenTo(Adapt, {
        "trickle:steplock": this.onStepLock,
        "trickle:resize": this.onTrickleResize,
        "trickle:stepunlock": this.onStepUnlock,
        "trickle:kill": this.onKill,
        "trickle:finished": this.onFinished,
        "remove": this.onRemove
      });
    },

    onAdaptInitialized: function() {
      this.wrapper = document.getElementById('wrapper');
      this.wrapper.addEventListener("scroll", this.preventWrapperScroll);
    },

    onStepLock: function(view) {
      this.isStepLocking = true;
      this.stepView = view;
      $(window).on("resize", this.onResize);
      $(".page").on("resize", this.onResize);

      // wait for height / visibility to adjust
      Adapt.trigger("trickle:resize");
    },

    preventWrapperScroll: function(event) {
      if (!this.isStepLocking) return;
      // Screen reader can scroll the #wrapper instead of the window.
      // This code overcomes that behaviour.
      var top = this.wrapper.scrollTop;
      if (top === 0) return;
      this.wrapper.scrollTop = 0;
      window.scrollTo(0, window.pageYOffset + top);
    },

    onResize: function() {
      if (!this.isStepLocking) return;
      Adapt.trigger("trickle:resize");
    },

    onTrickleResize: function() {
      if (!this.isStepLocking) return;
      var offset = this.stepView.$el.offset();
      var height = this.stepView.$el.height();

      var $wrapper = $(this.wrapper);

      var bottom = offset['top'] + height;

      $wrapper.css("height", bottom );
    },

    onStepUnlock: function(view) {
      this.isStepLocking = false;
      this.stepView = null;
      $(window).off("resize", this.onResize);
      $(".page").off("resize", this.onResize);
    },

    onKill: function() {
      this.onFinished();
      this.onStepUnlock();
    },

    onFinished: function() {
      this.wrapper.removeEventListener("scroll", this.preventWrapperScroll);
      $(this.wrapper).css("height", "");
    },

    onRemove: function() {
      this.onStepUnlock();
      this.stepView = null;
    }

  });

  return new TrickleBodyResizeHandler();

});
