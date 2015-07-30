define(function() {
	
	function StructureType(id, plural, level) {
		this._id = id;
		this._plural = plural;
		this._level = level;
		StructureType.levels+=1;
	}
	StructureType.levels = 0;

	StructureType.prototype = {};

	StructureType.prototype.toString = function() {
		return this._id;
	};

	StructureType.fromString = function(value) {
		switch (value) {
		case StructureType.Page._id: case StructureType.Page._plural:
			return StructureType.Page;
		case StructureType.Article._id: case StructureType.Article._plural:
			return StructureType.Article;
		case StructureType.Block._id: case StructureType.Block._plural:
			return StructureType.Block;
		case StructureType.Component._id: case StructureType.Component._plural:
			return StructureType.Component;
		}
	};

	StructureType.fromInt = function(value) {
		switch (value) {
		case StructureType.Page._level: 
			return StructureType.Page;
		case StructureType.Article._level: 
			return StructureType.Article;
		case StructureType.Block._level: 
			return StructureType.Block;
		case StructureType.Component._level: 
			return StructureType.Component;
		}
	};

	StructureType.Page = new StructureType("page", "pages", 1);
	StructureType.Article = new StructureType("article", "articles", 2);
	StructureType.Block = new StructureType("block", "blocks", 3);
	StructureType.Component = new StructureType("component", "components", 4);

	return StructureType;

});