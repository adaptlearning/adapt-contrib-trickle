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
                'click .trickle-button':'onTrickleButtonClicked',
                'click [data-event="menu"]':'onMenuClicked'
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
                this.pageElements[this.trickleCurrentIndex].set('_isVisible', true);
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
                    if (!this.pageElements[this.trickleCurrentIndex].get('_trickle') && this.pageElements[this.trickleCurrentIndex].get('_type') == 'block') {
                        this.setItemToVisible(this.pageElements[this.trickleCurrentIndex]);
                    }
                }
            },

            blockSetToComplete: function(block) {
                // Index here is plus one
                if (this.trickleCurrentIndex == this.pageElements.length) {
                    var finalElement = this.pageElements[this.pageElements.length-1];
                    if(finalElement.get('_trickle') && finalElement.get('_trickle').button &&  finalElement.get('_trickle').button.final) {
                        this.showFinal(finalElement);
                    }
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
                model.set('_isVisible', true);
            },

            showItem: function(model) {
                $('.' + model.get('_id')).removeClass('trickle-hidden');
                Adapt.trigger('device:screenSize', Adapt.device.screenWidth);
            },

            hideItem: function(model) {
                model.set('_isVisible', false);
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

            onMenuClicked: function(event) {
                event.preventDefault();
                Adapt.trigger('navigation:backButton');
            },

            showTrickle: function () {
                var buttonView = new TrickleButtonView({
                    model: this.pageElements[this.trickleCurrentIndex-1]
                });

                this.$el.html(buttonView.$el).show();
                this.$('.trickle-button').addClass('trickle-button-show');
            },

            showFinal: function (pageElement) {
                var buttonView = new TrickleFinalButtonView({
                    model: pageElement
                });
                this.$el.html(buttonView.$el).show();
                this.$('.trickle-final').addClass('trickle-button-show');
            },

            hideTrickle: function() {
                this.$el.hide();
            },

            scrollToItem: function(item, duration) {
                Adapt.trigger('device:resize');
                $(window).scrollTo("." + item.get('_id'), {
                    duration: duration || 300,
                    offset: {
                        top:-($('.navigation').height()+10)
                    }
                });
            }

        });

        var TrickleButtonView = Backbone.View.extend({
            templateName: "trickle-button",

            initialize: function(){
                this.render();
                this.listenTo(Adapt, 'remove', this.remove);
            },

            render: function () {
                var data = this.model.toJSON();
                var template = Handlebars.templates[this.templateName];
                this.$el.html(template(data));
                return this;
            }
        });

        var TrickleFinalButtonView = TrickleButtonView.extend({
            templateName: "trickle-final"
        });

        new TrickleView({model: pageModel});
    }

    Adapt.on('router:page', function(model) {
        var availableArticles;
        var availableBlocks;
        var trickleArticles;
        var trickleBlocks;
        availableArticles = model.getChildren();
        availableBlocks = model.findDescendants('blocks');

        trickleArticles = _.filter(availableArticles.models, function(article) {
            return article.get('_trickle');
        });

        trickleBlocks = _.filter(availableBlocks.models, function(block) {
            return block.get('_trickle');
        });

        // If trickle exists on the page
        if (trickleArticles.length > 0 || trickleBlocks.length > 0) {
            setupTrickleView(model, trickleArticles);
        }
    });

});
