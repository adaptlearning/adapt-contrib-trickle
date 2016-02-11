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
                return new Backbone.Collection(descendants);
            }

            var children = this.getChildren();

            for (var i = 0, l = children.models.length; i < l; i++) {

                var child = children.models[i];
                if (child.get("_type") === "component") {

                    descendants.push(child);

                } else {

                    var subDescendants = child.getDescendants(parentFirst);
                    if (parentFirst == true) descendants.push(child);
                    descendants = descendants.concat(subDescendants.models);
                    if (parentFirst != true) descendants.push(child);

                }

            }

            return new Backbone.Collection(descendants);
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
        findRelative: function(relativeString, limitParentId) {
            //return a model relative to the specified one
            var rootModel = Adapt.course;
            if (limitParentId) {
                rootModel = Adapt.findById(limitParentId);
            }

            var relativeOffset = parseRelativeString(relativeString);
            var searchBackwards = (relativeOffset.offset < 0);

            var modelId = this.get("_id");

            var movementCount = 0;

            if (searchBackwards) {
                var pageDescendants = rootModel.getDescendants(true).toJSON();
                var modelIndex = _.findIndex(pageDescendants, function(pageDescendant) {
                    if (pageDescendant._id === modelId) {
                        return true;
                    }
                    return false;
                });

                for (var i = modelIndex, l = -1; i > l; i--) {
                    var descendant = pageDescendants[i];
                    if (descendant._type === relativeOffset.type) {
                        if (-movementCount === relativeOffset.offset) {
                            return Adapt.findById(descendant._id);
                        }
                        movementCount++;
                    }
                }
            } else {
                var pageDescendants = rootModel.getDescendants().toJSON();
                var modelIndex = _.findIndex(pageDescendants, function(pageDescendant) {
                    if (pageDescendant._id === modelId) {
                        return true;
                    }
                    return false;
                });
                for (var i = modelIndex, l = pageDescendants.length; i < l; i++) {
                    var descendant = pageDescendants[i];
                    if (descendant._type === relativeOffset.type) {
                        if (movementCount === relativeOffset.offset) {
                            return Adapt.findById(descendant._id);
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
