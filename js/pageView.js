define([
    'core/js/adapt',
    './trickleView'
], function(Adapt, TrickleView) {

    var PageView = Backbone.View.extend({

        currentDescendantIndex: 0,
        currentLocksOnDescendant: 0,
        currentDescendant: null,

        initialize: function(options) {
            if (!this.isPageEnabled()) {
                return this.detachFromPage();
            }
            this.setupDescendants();
            if (!this.haveDescendantsGotTrickle()) {
                return this.detachFromPage();   
            }
            this.addClassToHtml();
            this.setupEventListeners();
        },

        isPageEnabled: function() {
            var trickleConfig = Adapt.trickle.getModelConfig(this.model);
            if (trickleConfig && trickleConfig._isEnabled === false) return false;
            return true;
        },

        setupDescendants: function() {
            this.currentDescendant = null;
            this.descendantViews = {};
            this.getDescendants();
            Adapt.trigger("trickle:descendants", this);
        },

        descendantsChildFirst: null,
        descendantsParentFirst: null,
        descendantViews: null,

        getDescendants: function() {
            this.descendantsChildFirst = this.model.getDescendants();
            this.descendantsParentFirst = this.model.getDescendants(true);

            //if some descendants flip between _isAvailable true/false they must have their defaults set before the filter is applied
            this.setDescendantsTrickleDefaults();

            this.descendantsChildFirst = this.filterComponents(this.descendantsChildFirst);
            this.descendantsParentFirst = this.filterComponents(this.descendantsParentFirst);

        },

        filterComponents: function(descendants) {
            return _.filter(descendants, function(descendant) {
                if (descendant.get("_type") === "component") return false;
                if (!descendant.get("_isAvailable")) return false;
                return true;
            });
        },

        setDescendantsTrickleDefaults: function() {
            //use parent first as likely to get to article
            _.each(this.descendantsParentFirst, _.bind(function(descendant) {
                var trickle = Adapt.trickle.getModelConfig(descendant);
                if (!trickle) {
                    return;
                }

                //check if trickle is configures on descendant
                //NOTE: Removed for banked assessments
                //var isTrickleConfigured = descendant.get("_isTrickleConfigured");
                //if (isTrickleConfigured) return;

                //setup steplocking defaults
                trickle._stepLocking = _.extend({
                    "_isEnabled": true, //(default=true)
                    "_isCompletionRequired": true, //(default=true)
                    "_isLockedOnRevisit": false //(default=false)
                }, trickle._stepLocking);

                //setup main trickle defaults
                trickle = _.extend({
                    "_isEnabled": true, //(default=true)
                    "_autoScroll": true, //(default=true)
                    "_scrollDuration": 500, //(default=500)
                    "_onChildren": true, //(default=true)
                    "_scrollTo": "@block +1" //(default="@block +1")
                }, trickle);

                Adapt.trickle.setModelConfig(descendant, trickle);

                //check article "onChildren" rule
                if (trickle._onChildren 
                    && descendant.get("_type") === "article") {
                    this.setupArticleOnChildren(descendant, trickle);
                }

                //set descendant trickle as configured
                descendant.set("_isTrickleConfigured", true);

            }, this));
        },

        setupArticleOnChildren: function(articleModel, articleTrickleConfig) {
            //set trickle on all blocks, using article config with block overrides
            var articleBlocks = articleModel.getChildren();

            articleBlocks.each(function(blockModel, index) {
                var blockTrickleConfig = Adapt.trickle.getModelConfig(blockModel);

                //overlay block trickle on article trickle
                //this allows values to carry through from the article to the block 
                //retains any value overriden in the block
                for (var k in blockTrickleConfig) {
                    //handle nested objects to one level
                    if (typeof blockTrickleConfig[k] === "object") {
                        blockTrickleConfig[k] = _.extend({}, articleTrickleConfig[k], blockTrickleConfig[k]);
                    }
                }

                blockTrickleConfig = _.extend({}, articleTrickleConfig, blockTrickleConfig);


                //setup start/final config
                if (articleBlocks.length === index+1) {
                    blockTrickleConfig._isFinal = true;
                }
                if (index === 0) {
                    blockTrickleConfig._isStart = true;
                }

                Adapt.trickle.setModelConfig(blockModel, blockTrickleConfig);
            });

        },

        haveDescendantsGotTrickle: function() {
            return _.some(this.descendantsChildFirst, function(descendant) {
                var trickle = Adapt.trickle.getModelConfig(descendant);
                if (!trickle) return false;
                if (trickle._isEnabled === true) {
                    return true;
                }
                return false;
            });
        },

        addClassToHtml: function() {
            $("html").addClass("trickle");
        },

        setupEventListeners: function() {
            this.listenTo(Adapt, {
                "remove": this.onRemove,
                
                "articleView:preRender": this.onDescendantPreRender,
                "blockView:preRender": this.onDescendantPreRender,

                "trickle:unwait": this.onUnwait,
                "trickle:wait": this.onWait,
                "trickle:continue": this.onContinue,
                "trickle:skip": this.onSkip,

                "trickle:kill": this.onKill
            });
            this.listenToOnce(this.model, "change:_isReady", this.onPageReady);
        },

        onDescendantPreRender: function(view) {
            //ignore components
            if (view.model.get("_type") === "component") return;

            var descendantView = new TrickleView({
                model: view.model,
                el: view.el
            });
            this.descendantViews[view.model.get("_id")] = descendantView;
        },

        //trickle lifecycle

        onPageReady: function(model, value) {
            if (!value) return;

            this.currentDescendant = null;

            Adapt.trigger("trickle:started");
            this.gotoNextDescendant();
        },

        gotoNextDescendant: function() {
            this.getDescendants();

            if (this.currentDescendant) {
                this.currentDescendant.trigger("stepunlock");
                this.currentDescendant = null;
            }

            for (var index = this.currentDescendantIndex || 0, l = this.descendantsChildFirst.length; index < l; index++) {
                var descendant = this.descendantsChildFirst[index];
                switch ( descendant.get("_type") ) {
                case "block": case "article":
                    this.currentLocksOnDescendant = 0;
                    this.currentDescendantIndex = index;
                    var currentId = descendant.get("_id");
                    this.currentDescendant = this.descendantViews[currentId];
                    this.currentDescendant.trigger("steplock");
                    return;
                }
            }
            this.finished();
        },

        onContinue: function(view) {
            if (!this.currentDescendant) return;
            if (view.model.get("_id") !== this.currentDescendant.model.get("_id")) return;

            this.onSkip();
        },

        onWait: function() {
            this.currentLocksOnDescendant++;
        },

        onUnwait: function() {
            this.currentLocksOnDescendant--;
            if (this.currentLocksOnDescendant > 0) return;
            
            var lastDescendant = this.currentDescendant.model;
            
            this.currentDescendantIndex++;
            this.gotoNextDescendant();

            Adapt.trickle.scroll(lastDescendant);
            
        },

        onSkip: function() {
            //wait for all handlers to accept skip
            _.defer(_.bind(function() {
                this.currentDescendantIndex++;
                this.gotoNextDescendant();
            }, this));
        },

        onKill: function() {
            this.finished();
            this.detachFromPage();
        },

        finished: function() {
            Adapt.trigger("trickle:finished");
            this.detachFromPage();
        },

        //end of trickle lifecycle

        onRemove: function() {
            this.finished();
        },

        detachFromPage: function() {
            this.removeClassFromHtml();
            this.undelegateEvents();
            this.stopListening();
            this.model = null;
            this.$el = null;
            this.el = null;
            this.currentDescendant = null;
            this.descendantViews = null;
            this.descendantsChildFirst = null;
            this.descendantsParentFirst = null;
            Adapt.trickle.pageView = null;
        },

        removeClassFromHtml: function() {
            $("html").removeClass("trickle");
        }
                
    });

    return PageView;

});
