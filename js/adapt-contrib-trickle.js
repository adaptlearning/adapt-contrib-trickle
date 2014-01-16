/*
* adapt-contrib-trickle
* License - http://github.com/adaptlearning/adapt_framework/LICENSE
* Maintainers - Kevin Corry <kevinc@learningpool.com>
*/
define(function(require) {

  var Adapt = require('coreJS/adapt');
  var trickleEnabled = false;
  function setupTrickleView (model) {

    var TrickleView = Backbone.View.extend({

      className: "extension-trickle",

      events: {
        'click .trickle-button':'onTrickleButtonClicked'
      },

      initialize: function() {
        this.setupTrickle();
        this.listenTo(Adapt, 'remove', this.removeTrickle);
        this.listenTo(Adapt, 'pageView:ready', this.startTrickle);
        this.render();
      },

      render: function () {
        this.$el.appendTo('#wrapper');
        return this;
      },

      setupTrickle: function() {
        // Get all trickle blocks and articles
        this.trickleElements = new Array();
        var articleChildren = this.model.getChildren();

        _.each(articleChildren.models, function(article) {

          if (article.get('_trickle')) {
            // Trickle is set on article, which overrides child block settings
            article.setOnChildren('_trickle', article.get('_trickle'));
            this.trickleElements.push(article);
            this.listenTo(article, "change:_isComplete", this.showContinueButton);

            var articleBlocks = article.findDescendants('blocks');
            _.each(articleBlocks.models, function(articleBlock) {
              this.trickleElements.push(articleBlock);
              this.listenTo(articleBlock, "change:_isComplete", this.showContinueButton);
            }, this);

          } else {
            // Individual block setting detected
            var articleBlocks = article.findDescendants('blocks');
            articleBlocks = _.filter(articleBlocks.models, function(block) {
              return block.get('_trickle');
            });

            // Find the previous sibling block
            _.each(articleBlocks, function(individualBlock) {
              var previousSibling = this.getPreviousSibling(individualBlock);
              if (previousSibling) {
                previousSibling.set('_isTrickleSibling', true);
                this.trickleElements.push(previousSibling);
              }

              this.trickleElements.push(individualBlock);
              this.listenTo(individualBlock, "change:_isComplete", this.showContinueButton);

            }, this);
          }

        }, this);

        this.lastTrickleIndex = _.indexOf(this.trickleElements, _.last(this.trickleElements));
      },

      startTrickle: function() {
        this.trickleCurrentIndex = -1;

        // Hide all elements
        if (this.trickleElements) {
          _.each(this.trickleElements, function(element) {
            if (!element.get('_isTrickleSibling')) {
              this.hideItem(element);
            }
          }, this);

          // Then show the first item, no scroll
          this.showNextTrickleItem();
        }
      },

      showItem: function(item) {
        $('.' + item.get('_id')).removeClass('trickle-hidden');
        item.set('_isVisible', true);
      },

      hideItem: function(item) {
        $('.' + item.get('_id')).addClass('trickle-hidden');
        item.set('_isVisible', false);
      },

      showNextTrickleItem: function (scroll) {
        var scrollTo = scroll || false;
        if (this.trickleElements[this.trickleCurrentIndex+1]) {
          var item = this.trickleElements[this.trickleCurrentIndex+1];
          if (item.get('_isTrickleSibling')) {
            if (!item.get('_isComplete')) {
              if (this.trickleCurrentIndex == -1) {
                this.trickleCurrentIndex = _.indexOf(this.trickleElements, item);
              }
              // Previous sibling is incomplete, scroll to it
              if (scrollTo) {
                this.scrollToItem(item);
              }
              this.listenTo(item, "change:_isComplete", this.showSiblingContinueButton);
            } else {
              // Previous sibling complete, show the next trickle item
              this.trickleCurrentIndex = _.indexOf(this.trickleElements, item);
              this.showNextTrickleItem(scrollTo);
            }
          } else {
            this.showItem(item);
            this.trickleCurrentIndex = _.indexOf(this.trickleElements, item);

            // We need to show the first block also for articles
            if (item.get('_type') == 'article') {
              this.showNextTrickleItem(scrollTo);
              return;
            }
            if (scrollTo) {
              this.scrollToItem(item);
            }
          }
        }
      },

      getPreviousSibling: function(block) {
        var previousSibling = false;
        var trickleSiblings = block.getParent().getChildren();
        var currentIndex = _.indexOf(trickleSiblings.models, block);
        var previousIndex = currentIndex - 1;
        if (previousIndex >= 0) {
          previousSibling = trickleSiblings.models[previousIndex];
          // If the previous sibling has trickle setup, don't worry about it
          previousSibling = previousSibling.get('_trickle') ? false : previousSibling;
        }
        return previousSibling;
      },

      onTrickleButtonClicked: function(event) {
        event.preventDefault();
        this.doTrickle();
        this.hideButton();
      },

      showContinueButton: function () {
        // Show a 'continue' button if there are further trickle items
        if (this.trickleCurrentIndex != this.lastTrickleIndex) {
          var currentItem = this.trickleElements[this.trickleCurrentIndex];
          var buttonView = new TrickleButtonView({model: currentItem});
          this.$el.html(buttonView.$el);
          this.$('.trickle-button').addClass('trickle-button-show');
        }
      },

      showSiblingContinueButton: function () {
        // Siblings don't have _trickle attributes,
        // so let the view render the default message
        var buttonView = new TrickleButtonView({model: new Backbone.Model()});
        this.$el.html(buttonView.$el);
        this.$('.trickle-button').addClass('trickle-button-show');
      },

      hideButton: function () {
        this.$('.trickle-button').removeClass('trickle-button-show');
      },

      doTrickle: function() {
        this.showNextTrickleItem(true);
      },

      scrollToItem: function(item, duration) {
        Adapt.trigger('device:resize');
        $(window).scrollTo("." + item.get('_id'), {
          duration: duration || 300,
          offset: {
            top:-($('.navigation').height()+10)
          }
        });
      },

      removeTrickle: function() {
        trickleEnabled = false;
        this.remove();
      }

    });

    var TrickleButtonView = Backbone.View.extend({
      initialize: function(){
        this.render();
      },

      render: function () {
        var data = this.model.toJSON();
        var template = Handlebars.templates["trickle-button"];
        this.$el.html(template(data));
        return this;
      }
    });

    new TrickleView({model: model});
  }

  Adapt.on('articleView:preRender', function(view) {
    if (!view.model.get('_isComplete')) {
      // If trickle exists on the page
      var articleBlocks = view.model.findDescendants('blocks');
      trickleBlocks = _.filter(articleBlocks.models, function(block) {
        return block.get('_trickle');
      });

      if (view.model.get('_trickle') || trickleBlocks.length > 0) {
        if (!trickleEnabled) {
          trickleEnabled = true;
          var parentPage = view.model.getParent();
          setupTrickleView(parentPage);
        }
      }
    }
  });

});
