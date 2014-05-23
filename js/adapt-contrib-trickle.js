/*
* adapt-contrib-trickle
* License - http://github.com/adaptlearning/adapt_framework/LICENSE
* Maintainers - Kevin Corry <kevinc@learningpool.com>, Daryl Hedley <darylhedley@hotmail.com>
*/
define(function(require) {

    var Adapt = require('coreJS/adapt');

    function setupTrickleView (pageModel, trickleArticles) {

        var TrickleView = Backbone.View.extend({

            className: "extension-trickle",

            events: {
                'click .trickle-button':'onTrickleButtonClicked'
            },

            initialize: function() {
                this.setupTrickle();
                this.listenTo(Adapt, 'remove', this.remove);
                this.listenTo(Adapt, 'pageView:ready', this.startTrickle);
                this.listenTo(Adapt, 'blockView:preRender', this.hideView);
                this.listenTo(Adapt, 'articleView:preRender', this.hideView);
                this.listenTo(Adapt.blocks, 'change:_isComplete', this.blockSetToComplete);
                this.listenTo(Adapt.blocks, 'change:_isVisible', this.elementSetToVisible);
                this.listenTo(Adapt.articles, 'change:_isVisible', this.elementSetToVisible);
                this.render();
            },

            render: function () {
                this.$el.appendTo('body');
                return this;
            },

            setupTrickle: function() {
                this.trickleElements = [];
                this.pageElements = [];
                this.trickleCurrentIndex = 0;
                this.hideAllElements();
                this.setTrickleArticleChildren();
                this.setupPageElementsArray();
            },

            hideView: function(view) {
                view.$el.addClass('trickle-hidden');
            },

            hideAllElements: function() {
                pageModel.getChildren().each(function(article) {
                    this.hideItem(article);
                }, this);
                pageModel.findDescendants('blocks').each(function(block) {
                    this.hideItem(block);
                }, this);
                pageModel.findDescendants('components').each(function(component) {
                    this.hideItem(component);
                }, this);
            },

            setTrickleArticleChildren: function() {
                _.each(trickleArticles, function(trickleArticle) {

                    var articlesBlocks = trickleArticle.getChildren();
                    articlesBlocks.each(function(block) {
                        if(!block.get('_trickle')) {
                            block.set('_trickle', trickleArticle.get('_trickle'));
                        }
                    });
                }, this);
            },

            setupPageElementsArray: function() {
                pageModel.getChildren().each(function(article) {
                    this.pageElements.push(article);
                    article.getChildren().each(function(block) {
                        this.pageElements.push(block);
                    }, this);
                }, this);
            },

            startTrickle: function(pageView) {
                this.trickleCurrentIndex = 0;
                this.trickleStarted = true;
                this.pageElements[this.trickleCurrentIndex].set('_isVisible', true, {pluginName: "_trickle"});             
            },

            elementSetToVisible: function(element) {
                // Should fire anytime an element becomes visible
                // Check against this elements index and show trickle if next element has _trickle
                if (element.get('_type') == "article") {

                    if (element.get('_isComplete')) {
                        this.showItem(this.pageElements[this.trickleCurrentIndex]);
                        if (this.trickleCurrentIndex == this.pageElements.length-1) {
                            return;
                        }
                        this.changeTrickleCurrentIndex();
                        this.setItemToVisible(this.pageElements[this.trickleCurrentIndex]);
                        return;
                    }

                    this.showItem(this.pageElements[this.trickleCurrentIndex]);
                    this.changeTrickleCurrentIndex();
                    this.setItemToVisible(this.pageElements[this.trickleCurrentIndex]);
                } else if (element.get('_type') == "block") {

                    if (element.get('_isComplete')) {
                        this.showItem(this.pageElements[this.trickleCurrentIndex]);
                        if (this.trickleCurrentIndex == this.pageElements.length-1) {
                            this.changeTrickleCurrentIndex();
                            return;
                        }
                        this.changeTrickleCurrentIndex();
                        this.setItemToVisible(this.pageElements[this.trickleCurrentIndex]);
                        
                        return;
                    }

                    this.showItem(this.pageElements[this.trickleCurrentIndex]);
                    if (this.trickleCurrentIndex == this.pageElements.length-1) {
                        this.changeTrickleCurrentIndex();
                        return;
                    }
                    this.changeTrickleCurrentIndex();
                    if (!this.pageElements[this.trickleCurrentIndex].get('_trickle') 
                    && this.pageElements[this.trickleCurrentIndex].get('_type') == 'block') {
                        this.setItemToVisible(this.pageElements[this.trickleCurrentIndex]);
                    }
                }
            },

            blockSetToComplete: function(block) {
                // Index here is plus one
                if (this.trickleCurrentIndex == this.pageElements.length) {
                    return;
                }
                if  (this.pageElements[this.trickleCurrentIndex-1].get('_trickle')){
                    this.showTrickle();
                } else if (this.pageElements[this.trickleCurrentIndex].get('_trickle')){
                    this.showTrickle();
                } else if (!this.pageElements[this.trickleCurrentIndex].get('_trickle')) {
                    this.setItemToVisible(this.pageElements[this.trickleCurrentIndex]);
                }
            },

            changeTrickleCurrentIndex: function() {
                this.trickleCurrentIndex++;
            },

            setItemToVisible: function(model) {
                model.set('_isVisible', true, {pluginName:'_trickle'});
                if (model.get('_type') == 'block') {
                    model.setOnChildren('_isVisible', true, {pluginName: '_trickle'});
                }
            },

            showItem: function(model) {
                $('.' + model.get('_id')).removeClass('trickle-hidden');
                Adapt.trigger('device:screenSize', Adapt.device.screenWidth);
            },

            hideItem: function(model) {
                model.set('_isVisible', false, {pluginName: '_trickle'});
            },

            onTrickleButtonClicked: function(event) {
                event.preventDefault();
                var currentTrickleItem = this.pageElements[this.trickleCurrentIndex];
                if (this.pageElements[this.trickleCurrentIndex].get('_type') == 'article') {
                    currentTrickleItem = this.pageElements[this.trickleCurrentIndex+1];
                    this.setItemToVisible(this.pageElements[this.trickleCurrentIndex]);
                } else {
                    this.setItemToVisible(this.pageElements[this.trickleCurrentIndex]);
                }
                this.hideTrickle();
                
                _.defer(_.bind(function() {
                    Adapt.trigger('device:screenSize', Adapt.device.screenWidth);
                    this.scrollToItem(currentTrickleItem);
                }, this));
            },

            showTrickle: function () {
                var buttonView = new TrickleButtonView({
                    model: this.pageElements[this.trickleCurrentIndex-1]
                });

                this.$el.html(buttonView.$el).show();
                this.$('.trickle-button').addClass('trickle-button-show');
            },

            hideTrickle: function() {
                this.$el.hide();
            },

            scrollToItem: function(item, duration) {
                Adapt.trigger('device:resize');
                $(window).resize();
                $(window).scrollTo("." + item.get('_id'), {
                    duration: duration || 300,
                    offset: {
                        top:-($('.navigation').height()+10)
                    }
                });
            }

        });

        var TrickleButtonView = Backbone.View.extend({
            initialize: function(){
                this.render();
                this.listenTo(Adapt, 'remove', this.remove);
            },

            render: function () {
                var data = this.model.toJSON();
                var template = Handlebars.templates["trickle-button"];
                this.$el.html(template(data));
                return this;
            }
        });

        new TrickleView({model: pageModel});
    }

    Adapt.on("pageView:preRender", function(view) {
        var model = view.model;
        var availableArticles;
        var availableBlocks;
        var trickleArticles;
        var trickleBlocks;
        availableArticles = model.getChildren();
        availableBlocks = model.findDescendants('blocks');

        trickleArticles = _.filter(availableArticles.models, function(article) {
            if (article.get('_trickle')) {
                return article.get('_trickle')._isEnabled === true;
            }
        });

        trickleBlocks = _.filter(availableBlocks.models, function(block) {
            if (block.get('_trickle')) {
                return block.get('_trickle')._isEnabled === true;
            }
        });

        // If trickle exists on the page
        if (trickleArticles.length > 0 || trickleBlocks.length > 0) {
            setupTrickleView(model, trickleArticles);
        }
    });

});
