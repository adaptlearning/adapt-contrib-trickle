adapt-contrib-trickle
=====================

An Adapt core contributed extension that provides vertical locking

Installation
------------

First, be sure to install the [Adapt Command Line Interface](https://github.com/adaptlearning/adapt-cli), then from the command line run:-

        adapt install adapt-contrib-trickle

Basic Usage
-----
To setup locking, add the ``_trickle`` attribute to the article or block you wish to lock:

```
"_trickle": {
    "_isEnabled": true
}
```

If an article is set to trickle with ``_onChildren: true``, all blocks underneath the article will be trickled unless explicitly overridden. Setting ``_trickle`` on an block will override any ``_trickle`` settings of the article (with ``_onChildren: true``) above it. 

```
"_trickle": {
	"_isEnabled": true,
	"_onChildren": true
}
```

When the article/block is complete, a button will appear containing the text you specify in the ``text`` attribute.
Clicking this button will show and scroll to the next block (configurable).  
  
  
Additional Settings
-----  

Defaults:
```
"_trickle": {
    "_isEnabled": true,
    "_duration": 500,
    "_autoScroll": true,
    "_scrollTo": "@block +1",
    "_onChildren": false,
    "_button": {
        "_isEnabled": true,
        "_styleBeforeCompletion": "hidden",
        "_styleAfterClick": "hidden",
        "_isFullWidth": true,
        "_autoHide": true,
        "_className": "",
        "text": "Continue",
        "finalText": "",
        "_component": "trickle-button"
    },
    "_stepLocking": {
        "_isEnabled": true,
        "_isCompletionRequired": true,
        "_isLockedOnRevisit": false
    }
}
```

``_isEnabled``  
-------
Can be set in course.json, page.json, article.json and block.json to disable trickle where not required.  
  
``_duration``  
-------
Is the duration of the scroll animation.  
  
``_autoScroll``  
-------
If set to ``true``, will automatically scroll according to the directions described in the ``_scrollTo`` attribute.  
  
``_scrollTo``  
-------
Signifies to where trickle should scroll when the relevant step is unlocked.  
``@block +1`` - scroll forward to the next block.  
``@article +2`` - scroll forward two articles.  
``.className`` - scroll to the specified classname.  
``id`` - scroll to the give id.   
  
``_onChildren``  
-------
Used when an article should set trickle on all child blocks rather than trickle on the article.  
  
``_button``
-------
Button specific attributes.  
  
``_button._isEnabled``  
-------
If set to ``false``, no button will be shown.  
Steplocking will work on component completion only and will scroll to the relevant section if ``_autoScroll`` is ``true``.  
  
``_button._styleBeforeCompletion```  
-------
Values: "hidden" | "visible"  
  
``_button._styleAfterClick``
-------
Values: "hidden" | "disabled" | "scroll"  
  
``_button._isFullWidth``  
-------
Will position the button fixed to the bottom of the window. This option will force ``_autoHide: true`` and ``_stepLocking._isEnabled: true``. The button fade-out when the users scrolls upwards, away from the bottom of the window.  
  
``_button._autoHide``  
-------
Will hide the button when it scrolls from view.  Will show the button when it scrolls into view.  
  
``_button._className``  
-------
Available option: ``"trickle-round-arrow"``  
  
Will add a class to the button container.  
  
``"trickle-round-arrow"`` Will display a round button with an arrow and no text instead of the classic square button with text.  

``_button._text``  
-------
Defines the default button text.  
  
``_button._finalText``  
-------
Defines the last item button text when set on the article with ``_onChildren: true``.

``_.button._component``  
-------
Defines the trickle plugin which should handle the interaction. At present only ``"trickle-button"`` is available but it is possible to create new plugins.  
  
``_stepLocking``  
-------
Steplocking (section hiding) specific attributes.  
  
``_stepLocking._isEnabled``  
-------
Will allow trickle to truncate the page at the step until the user is allowed to move forward.  
  
``_stepLocking._isCompletionRequired``  
-------
Forces the user to complete the block/article before the step is unlocked. If the block/article is reset on a page revisit, the lock will be reapplied.  
  
``_stepLocking._isLockedOnRevisit``  
-------
On every page revisit the step will be relocked.  
