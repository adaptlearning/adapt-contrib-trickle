define([
    'coreJS/adapt',
    'coreModels/adaptModel'
], function(Adapt, AdaptModel) {

    _.extend(AdaptModel.prototype, {
        
        /*
        * Fetchs the sub structure of an id as a flattened array
        *
        *   Such that the tree:
        *       { a1: { b1: [ c1, c2 ], b2: [ c3, c4 ] }, a2: { b3: [ c5, c6 ] } }
        *
        *   will become the array (parent first = false):
        *       [ c1, c2, b1, c3, c4, b2, a1, c5, c6, b3, a2 ]
        *
        *   or (parent first = true):
        *       [ a1, b1, c1, c2, b2, c3, c4, a2, b3, c5, c6 ]
        *
        * This is useful when sequential operations are performed on the page/article/block/component hierarchy.
        */
        getDescendants: function(parentFirst) {
            var descendants = [];

            if (this.get("_type") === "component") {
                descendants.push(this);
                return descendants;
            }

            var children = this.getChildren().models;

            for (var i = 0, l = children.length; i < l; i++) {

                var child = children[i];
                if (child.get("_type") === "component") {

                    descendants.push(child);

                } else {

                    var subDescendants = child.getDescendants(parentFirst);
                    if (parentFirst == true) descendants.push(child);
                    descendants = descendants.concat(subDescendants);
                    if (parentFirst != true) descendants.push(child);

                }

            }

            return descendants;
        },

        /*
        * Returns a relative structural item from the Adapt hierarchy
        *   
        *   Such that in the tree:
        *       { a1: { b1: [ c1, c2 ], b2: [ c3, c4 ] }, a2: { b3: [ c5, c6 ] } }
        *
        *       findRelative(modelC1, "@block +1") = modelB2;
        *       findRelative(modelC1, "@component +4") = modelC5;
        *
        */
        findRelative: function(relativeString, options) {
            var types = [ "menu", "page", "article", "block", "component" ];

            options = options || {};

            var modelId = this.get("_id");
            var modelType = this.get("_type");

            //return a model relative to the specified one if opinionated
            var rootModel = Adapt.course;
            if (options.limitParentId) {
                rootModel = Adapt.findById(options.limitParentId);
            }

            var relativeDescriptor = parseRelativeString(relativeString);

            var findAncestorType = (_.indexOf(types, modelType) > _.indexOf(types, relativeDescriptor.type));
            var findSameType = (modelType === relativeDescriptor.type);

            var searchBackwards = false;
            var movementCount = 0;

            // children first [c,c,b,a,c,c,b,a,p,c,c,b,a,c,c,b,a,p]
            var pageDescendants = rootModel.getDescendants();

            //choose search style
            if (findSameType || findAncestorType) {
                //examples a<>a or c<>b,a,p
                //assume next is 0 index
                //assume last is -1 index
                searchBackwards = (relativeDescriptor.offset <= 0);
            } else {
                //finding descendant
                //examples a<>c or a<>b
                if (relativeDescriptor.offset < 1) {
                    //assume last descendant is 0 index
                    searchBackwards = true;
                } else {
                    //assume next descendant is +1 index
                    movementCount = 1;
                    searchBackwards = false;
                }
            }

            //exclude not available and not visible if opinionated
            if (options.filterNotVisible) {
                pageDescendants = _.filter(pageDescendants, function(descendant) {
                    return descendant.get("_isVisible");
                });
            } 
            if (options.filterNotAvailable) {
                pageDescendants = _.filter(pageDescendants, function(descendant) {
                    return descendant.get("_isAvailable");
                });
            } 

            //find current index in array
            var modelIndex = _.findIndex(pageDescendants, function(pageDescendant) {
                if (pageDescendant.get("_id") === modelId) {
                    return true;
                }
                return false;
            });

            //search in appropriate order
            if (searchBackwards) {
                for (var i = modelIndex, l = -1; i > l; i--) {
                    var descendant = pageDescendants[i];
                    if (descendant.get("_type") === relativeDescriptor.type) {
                        if (-movementCount === relativeDescriptor.offset) {
                            return Adapt.findById(descendant.get("_id"));
                        }
                        movementCount++;
                    }
                }
            } else {
                for (var i = modelIndex, l = pageDescendants.length; i < l; i++) {
                    var descendant = pageDescendants[i];
                    if (descendant.get("_type") === relativeDescriptor.type) {
                        if (movementCount === relativeDescriptor.offset) {
                            return Adapt.findById(descendant.get("_id"));
                        }
                        movementCount++;
                    }
                }
            }

            return undefined;
        }
    });


    function parseRelativeString(relativeString) {
        var type = relativeString.substr(0, _.indexOf(relativeString, " "));
        var offset = parseInt(relativeString.substr(type.length));
        type = type.substr(1);

        /*RETURN THE TYPE AND OFFSET OF THE SCROLLTO
        * "@component +1"  : 
        * {
        *       type: "component",
        *       offset: 1
        * }
        */
        return { 
            type: type,
            offset: offset
        };
    }

});
