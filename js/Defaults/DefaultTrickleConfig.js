define(function() {

	var DefaultTrickleConfig = {
		_isEnabled: true,
		_scrollDuration: 500,
		_autoScroll: true,
		_onChildren: true,
		_button: {
			_isEnabled: true,
			_isFullWidth: true,
			_styleBeforeCompletion: "hidden",
			_styleAfterClick: "hidden",
			_autoHide: true,
			text: "Continue",
			_component: "trickle-button"
		},
		_stepLocking: {
	        _isEnabled: true, 
	        _isCompletionRequired: true,
	        _isLockedOnRevisit: false
	    },
	    _isInteractionComplete: false,
	    _scrollTo: "@block +1"
	};

	return DefaultTrickleConfig;
})