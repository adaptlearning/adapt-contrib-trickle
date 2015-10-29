define([
    'coreJS/adapt',
    './Defaults/DefaultTrickleConfig',
    './Utility/Models',
    './trickle-tutorPlugin',
    './trickle-buttonPlugin',
    './lib/jquery.resize'
], function(Adapt, DefaultTrickleConfig, Models) {

    var completionAttribute = "_isInteractionComplete";

    var Trickle = _.extend({

        onDataReady: function() {
            var trickleConfig = Adapt.config.get("_trickle");
            if (trickleConfig && trickleConfig._completionAttribute) completionAttribute = trickleConfig._completionAttribute;

            this.setupEventListeners();
        },

        onPagePreRender: function(view) {
            this.initializePage(view);
        },

        onArticlePreRender: function(view) {
            this.checkApplyTrickleToChildren( view.model );
        },

        onPagePostRender: function(view) {
            this.resizeBodyToCurrentIndex();
        },

        onArticleAndBlockPostRender: function(view) {
            this.setupStep( view.model );
        },

        onPageReady: function(view) {
            this.initializeStep();
            this.resizeBodyToCurrentIndex();
            this._listenToResizeEvent = true;
            this._isPageReady = true;
            Adapt.trigger("trickle:pageReady");
        },

        onAnyComplete: function(model, value, isPerformingCompletionQueue) {
            this.queueOrExecuteCompletion(model, value, isPerformingCompletionQueue);
        },

        onStepUnlockWait: function() {
            this._waitForUnlockRequestsCount++;
        },

        onStepUnlockUnwait: function() {
            this._waitForUnlockRequestsCount--;
            if (this._waitForUnlockRequestsCount < 0) this._waitForUnlockRequestsCount = 0;

            if (this._isFinished) return;

            var descendant = this.getCurrentStepModel();
            this.checkStepComplete(descendant);
        },

        onWrapperResize: function() {
            if (!this._listenToResizeEvent) {
                return;
            }

            this.resizeBodyToCurrentIndex();
            this._listenToResizeEvent = true;
        },

        onRemove: function(view) {
            this.endTrickle();
        },


        model: new Backbone.Model({}),

        _listenToResizeEvent: false,
        _isPageInitialized: false,
        _isPageReady: false,
        _isFinished: false,
        _currentStepIndex: 0,
        _descendantsChildrenFirst: null,
        _descendantsParentFirst: null,
        _pageView: null,
        _isTrickleOn: false,

        initialize: function() {
            this.listenToOnce(Adapt, "app:dataReady", this.onDataReady);
        },

        setupEventListeners: function() {
            this._onWrapperResize = _.bind(Trickle.onWrapperResize, Trickle);
            $("#wrapper").on('resize', this._onWrapperResize );

            this.listenTo(Adapt, "remove", this.onRemove);
            this.listenTo(Adapt, "pageView:preRender", this.onPagePreRender);
            this.listenTo(Adapt, "pageView:postRender", this.onPagePostRender);
            this.listenTo(Adapt, "pageView:ready", this.onPageReady);

            this.listenTo(Adapt, "articleView:preRender", this.onArticlePreRender);
            this.listenTo(Adapt, "blockView:postRender articleView:postRender", this.onArticleAndBlockPostRender);

            this.listenTo(Adapt.articles, "change:"+completionAttribute, this.onAnyComplete);
            this.listenTo(Adapt.blocks, "change:"+completionAttribute, this.onAnyComplete);
            this.listenTo(Adapt.components, "change:"+completionAttribute, this.onAnyComplete);           

            this.listenTo(Adapt, "trickle:interactionComplete", this.checkStepComplete);

            this.listenTo(Adapt, "steplocking:wait", this.onStepUnlockWait);
            this.listenTo(Adapt, "steplocking:unwait", this.onStepUnlockUnwait);

            this.listenTo(Adapt, "trickle:relativeScrollTo", this.relativeScrollTo);

            this.listenTo(Adapt, "trickle:kill", this.endTrickle);
        },

        initializePage: function(view) {
            var pageId = view.model.get("_id");

            var pageConfig = Adapt.course.get("_trickle");
            if (pageConfig && pageConfig._isEnabled === false) return;

            this._descendantsChildrenFirst =  Models.getDescendantsFlattened(pageId);
            this._descendantsParentFirst = Models.getDescendantsFlattened(pageId, true);
            this._currentStepIndex = 0;
            this._isFinished = false;
            this._listenToResizeEvent = false;
            this._pageView = view;

            this.checkResetChildren();

            this.initializeStepUnlockWait();

            this._isPageInitialized = true;

        },

        checkResetChildren: function() {
            var descendantsChildrenFirst = this._descendantsChildrenFirst;
            for (var i = 0, model; model = descendantsChildrenFirst.models[i++];) {
                this.checkResetModel(model);
            }
        },

        checkResetModel: function(model) {
            var trickleConfig = this.getModelTrickleConfig(model);
            if (!trickleConfig) return;
            if (trickleConfig._onChildren) return;

            if (!trickleConfig._stepLocking || !trickleConfig._stepLocking._isEnabled == true) return;      
            
            if (model.get(completionAttribute) && !trickleConfig._isLocking) trickleConfig._isInteractionComplete = true;

            if (!trickleConfig._isInteractionComplete) {
                
                trickleConfig._isLocking = true;

            }

            if (trickleConfig._stepLocking._isLockedOnRevisit || 
                (trickleConfig._stepLocking._isCompletionRequired && !model.get(completionAttribute))) {

                trickleConfig._isInteractionComplete = false;
                trickleConfig._isLocking = true;

            }

        },

        getModelTrickleConfig: function(model) {

            function initializeModelTrickleConfig(model, parent) {
                var trickleConfig = model.get("_trickle");

                var courseConfig = Adapt.course.get("_trickle");
                if (courseConfig && courseConfig._isEnabled === false) return false;

                var trickleConfig = $.extend(true, 
                    {}, 
                    DefaultTrickleConfig, 
                    trickleConfig,
                    { 
                        _id: model.get("_id"), 
                        _areDefaultsSet: true,
                        _index: parent.getModelPageIndex(model)
                    }
                );

                if (model.get("_type") != "article") {
                    trickleConfig._onChildren = false;
                }

                var isLastPageItem = ( trickleConfig._index == parent._descendantsChildrenFirst.length - 2 );
                if (isLastPageItem && model.get("_type") != "article") {
                    return false;
                }

                model.set("_trickle", trickleConfig);

                return true;
            }

            var trickleConfig = model.get("_trickle");
            if (trickleConfig === undefined) return false;

            //if has been initialized already, return;
            if (trickleConfig._areDefaultsSet) return trickleConfig;

            if (!initializeModelTrickleConfig(model, this)) return false;
            
            return model.get("_trickle");
        },

        getModelPageIndex: function(model) {
            var descendants = this._descendantsChildrenFirst.toJSON();
            var pageDescendantIds = _.pluck(descendants, "_id");

            var id = model.get("_id");
            var index = _.indexOf( pageDescendantIds, id );

            return index;
        },

        initializeStepUnlockWait: function() {
            this._waitForUnlockRequestsCount = 0;
        },

        checkApplyTrickleToChildren: function(model) {
            if (model.get("_type") != "article") return;

            var trickleConfig = this.getModelTrickleConfig(model);
            if (!trickleConfig) return;
            if (!trickleConfig._onChildren) return;

            this.applyTrickleToChildren(model, trickleConfig);
        },

        applyTrickleToChildren: function(model, parentTrickleConfig) {
            var children = model.getChildren().models;
            for (var i = 0, l = children.length; i < l; i++) {

                var child = children[i];
                var childTrickleConfig = child.get("_trickle");

                var isLastItem = (i == l - 1);

                var isEnabled = true;
                if (childTrickleConfig) {
                    if (childTrickleConfig._isEnabled === false) {
                        isEnabled = false;
                    }
                }
                if (parentTrickleConfig) {
                    if (parentTrickleConfig._isEnabled === false) {
                        isEnabled = false;
                    }
                }

                var trickleConfig = $.extend(true, 
                    {}, 
                    parentTrickleConfig, 
                    childTrickleConfig, 
                    { 
                        _id: child.get("_id"),
                        _onChildren: false,
                        _isEnabled: isEnabled,
                        _isLastItem: isLastItem,
                        _index: this.getModelPageIndex(child)
                    }
                );

                var isLastPageItem = ( trickleConfig._index == this._descendantsChildrenFirst.length - 2 );
                if (isLastPageItem) {
                    continue;
                }

                child.set("_trickle", trickleConfig);

                this.checkResetModel(child);
                
            }
        },

        resizeBodyToCurrentIndex: function() {
            if (!this._isTrickleOn) return;
            
            if (this._isFinished) return this.showElements();

            this._listenToResizeEvent = false;

            this.showElements();

            var id = this.getCurrentStepModel().get("_id");
            var $element = $("." + id);

            if ($element.length === 0) {
                return;
            }

            var elementOffset = $element.offset();
            var elementBottomOffset = elementOffset.top + $element.outerHeight();

            $('body').css("height", elementBottomOffset + "px");
        },

        showElements: function() {
            if (!this._descendantsParentFirst) return;

            var model = this.getCurrentStepModel();
            var ancestors = this._descendantsParentFirst.models;
            var ancestorIds = _.pluck(this._descendantsParentFirst.toJSON(), "_id");

            var showToId;
            if (model !== undefined) {
                //Not at end of trickle
                showToId = model.get("_id");

                var isLastType = Models.isLastStructureType(model);

                if (!isLastType) {
                    //If current step model is not a component type:
                    //then show components for the selected parent
                    var currentAncestorIndex = _.indexOf(ancestorIds, showToId);
                    var ancestorChildComponents = ancestors[currentAncestorIndex].findDescendants("components");

                    showToId = ancestorChildComponents.models[ancestorChildComponents.models.length-1].get("_id");
                }

            } else {
                //At end, show all ids
                showToId = ancestors[ancestors.length -1].get("_id");
            }
            
            
            var showToIndex = _.indexOf(ancestorIds, showToId);

            for (var i = 0, l = ancestors.length; i < l; i++) {
                var itemModel = ancestors[i];
                if (i <= showToIndex) {
                    itemModel.set("_isVisible", true, { pluginName: "trickle" });
                } else {
                    itemModel.set("_isVisible", false, { pluginName: "trickle" });
                }
            }
            
        },

        getCurrentStepModel: function() {
            if (!this._descendantsChildrenFirst) return;

            return this._descendantsChildrenFirst.models[this._currentStepIndex];
        },

        setupStep: function(model) {
            var trickleConfig = this.getModelTrickleConfig(model)
            if (!trickleConfig) return;
            if (!trickleConfig._isEnabled) return;
            if (trickleConfig._onChildren) return;

            var isStepLocking = this.isModelStepLocking(model);
            trickleConfig._isStepLocking = isStepLocking;

            Adapt.trigger("trickle:interactionInitialize", model);
        },

        initializeStep: function() {
            if (this._isFinished) return;
            this.initializeStepUnlockWait();

            if (this.hasCurrentStepLock()) {
                this.startTrickle();
            } else {
                this.endTrickle();
            }
        },

        hasCurrentStepLock: function() {
            var currentIndex = this._currentStepIndex;
            var descendants = this._descendantsChildrenFirst.models;
            for (var i = currentIndex, l = descendants.length; i < l; i++) {
                var descendant = descendants[i];

                if (!this.isModelStepLocking(descendant)) continue;

                this._currentStepIndex = i;
                

                return true;
            }

            return false;
        },

        isModelStepLocking: function(model) {
            var trickleConfig = this.getModelTrickleConfig(model)
            if (!trickleConfig) return false;
            if (trickleConfig._onChildren) return false;

            if (trickleConfig._isEnabled === false) return false;
            
            if (!trickleConfig._stepLocking || !trickleConfig._stepLocking._isEnabled) return false;
            
            if (trickleConfig._isLocking) return true;
            if (trickleConfig._isInteractionComplete) return false;

            var isComplete = model.get(completionAttribute);
            if (isComplete !== undefined) return !isComplete;

            return true;
        },

        startTrickle: function() {
            this._isTrickleOn = true;
            $("html").addClass("trickle");
            Adapt.trigger("steplocking:waitInitialize");
            this.resizeBodyToCurrentIndex();
            this._listenToResizeEvent = true;
        },

        endTrickle: function() {
            this._currentStepIndex = -1;
            this._isFinished = true;
            $("body").css("height", "");
            $("html").removeClass("trickle");
            this._pageView = null;
            this.resizeBodyToCurrentIndex();
            this._isPageReady = false;
            this._listenToResizeEvent = true;
            this._isTrickleOn = false;
        },

        //completion reorder and processing
        _completionQueue: [],
        queueOrExecuteCompletion: function(model, value, isPerformCompletionQueue) {
            if (value === false) return;    

            if (isPerformCompletionQueue !== true) {
                //article, block and component completion trigger in a,b,c order need in c,b,a order
                //otherwise block completion events will occur before component completion events
                
                var isLastType = Models.isLastStructureType(model);

                if (!isLastType) {
                    //defer completion event handling if not at component level
                    return this._completionQueue.push({
                        model: model,
                        value: value    
                    });
                } else {
                    //if at component level, handle completion queue events after component completion is handled
                    if (this._isPageReady) {
                        _.defer(_.bind(this.performCompletionQueue, this));
                    } else {
                        this.listenToOnce(Adapt, "trickle:pageReady", function(){                            
                            this.performCompletionQueue();
                        });
                    }
                }
            }

            if (this._isPageReady) {
                Adapt.trigger("steplocking:waitCheck", model);
                this.checkStepComplete(model);
            } else {                
                this.listenToOnce(Adapt, "trickle:pageReady", function(){                    
                    Adapt.trigger("steplocking:waitCheck", model);
                    this.checkStepComplete(model);
                });
            }
        },

        performCompletionQueue: function() {
            while (this._completionQueue.length > 0) {
                var item = this._completionQueue.pop();
                this.queueOrExecuteCompletion(item.model, item.value, true);
            }
        },

        checkStepComplete: function(model) {
            if (this._isFinished) return;

            var currentModel = this.getCurrentStepModel();

            //if the model does not match the current trickle item then break
            if (model.get("_id") != currentModel.get("_id")) return;

            var trickleConfig = this.getModelTrickleConfig(model);
            if (!trickleConfig) return;
            
            //if plugins need to present before the interaction then break
            if (this.isStepUnlockWaiting()) return;
            
            //if completion is required and item is not yet complete then break
            if (trickleConfig._stepLocking._isCompletionRequired && !model.get(completionAttribute)) return;

            Adapt.trigger("trickle:interactionRequired", model);
            
            //if plugins need to present before the next step occurs then break
            if (this.isStepUnlockWaiting()) return;

            //set interaction complete
            trickleConfig._isLocking = false;
            trickleConfig._isInteractionComplete = true;

            this.stepComplete(model);
        },

        stepComplete: function(model) {
            this.initializeStep();

            Adapt.trigger('device:resize');

            this.scrollToStep(model);
        },

        scrollToStep: function(model) {
            var trickleConfig = this.getModelTrickleConfig(model);
            if (trickleConfig._autoScroll === false) return;

            var scrollTo = trickleConfig._scrollTo;
            
            //Allows trickle to scroll to a sibling / cousin component relative to the current trickle item
            this.relativeScrollTo( model, scrollTo );
        },

        isStepUnlockWaiting: function() {
            return this._waitForUnlockRequestsCount > 0;
        },
        
        relativeScrollTo: function(model, scrollTo) {
            if (scrollTo === undefined) scrollTo = "@block +1";

            var scrollToId = "";
            switch (scrollTo.substr(0,1)) {
            case "@":
                //NAVIGATE BY RELATIVE TYPE
                
                //Allows trickle to scroll to a sibling / cousin component relative to the current trickle item
                var relativeModel = Models.findRelative(model, scrollTo);
                
                if (relativeModel === undefined) return;
                scrollToId = relativeModel.get("_id");

                break;
            case ".":
                //NAVIGATE BY CLASS
                scrollToId = scrollTo.substr(1, scrollTo.length-1);
                break;
            default: 
                scrollToId = scrollTo;
            }

            if (scrollToId == "") return;
            
            var duration = model.get("_trickle")._scrollDuration || 500;
            _.delay(function() {
                Adapt.scrollTo("." + scrollToId, { duration: duration });
            }, 250);
        }
        
    }, Backbone.Events);

    Trickle.initialize();

    return Trickle;

})
