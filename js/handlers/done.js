define([
    'core/js/adapt'
], function(Adapt) {

    var TrickleDone = _.extend({

        initialize: function() {
            this.listenToOnce(Adapt, "app:dataReady", this.onAppDataReady);
        },

        onAppDataReady: function() {
            this.setupEventListeners();
        },

        setupEventListeners: function() {
            this.onDone = _.debounce(_.bind(this.onDone), 50);
            this.listenTo(Adapt, {
                "trickle:steplock": this.onDone,
                "trickle:stepunlock": this.onDone,
                "trickle:continue": this.onDone,
                "trickle:finished": this.onDone
            });
        },

        onDone: function() {
            Adapt.trigger("trickle:done");
        }

    }, Backbone.Events);

    TrickleDone.initialize();

    return TrickleDone;

});
