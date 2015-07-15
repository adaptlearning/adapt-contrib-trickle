#adapt-contrib-trickle

An Adapt core contributed extension that provides vertical locking

##Installation

First, be sure to install the [Adapt Command Line Interface](https://github.com/adaptlearning/adapt-cli), then from the command line run:-

        adapt install adapt-contrib-trickle

This extension can also be installed by adding the extension to the adapt.json file before running `adapt install`:
 
        "adapt-contrib-trickle": "*"

##Usage

Once installed, this extension can be used to control the presentation of content and the manner in which it can be navigated within an Adapt page. Read below to find out more.


##Settings overview

For example JSON format, see [example.json](example.json). A description of the core settings can be found at: [Core model attributes](https://github.com/adaptlearning/adapt_framework/wiki/Core-model-attributes)

To setup locking, add the ``_trickle`` attribute to the article or block you wish to lock:

```
"_trickle": {
    "_isEnabled": true,
    "_button": {
        "text": "Continue"
    }
}
```

When the article/block is complete, a button will appear containing the text specified in the ``text`` attribute.
Clicking this button will show and scroll to the next block (configurable).  
  
If an article is set to trickle with ``_onChildren: true`` (default), all blocks underneath the article will be trickled unless explicitly overridden. Setting ``_trickle`` on an block will override any ``_trickle`` settings of the article (with ``_onChildren: true``) above it.  
  
To use trickle on the article only, without applying trickle to children blocks, use:  

```
"_trickle": {
    "_isEnabled": true,
    "_onChildren": false
}
```
  
  
##Additional Settings

Defaults:
```
"_trickle": {
    "_isEnabled": true,
    "_autoScroll": true,
    "_scrollDuration": 500,
    "_scrollTo": "@block +1",
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

##Attributes
A description of the attributes are as follows:


####_isEnabled 
Can be set in course.json, page.json, article.json and block.json to disable trickle where not required.  
  
####_scrollDuration 
Specifies the duration of the scroll animation in milliseconds.  
Default: ``500``  
  
####_autoScroll 
If set to ``true``, will automatically scroll according to the directions described in the ``_scrollTo`` attribute.  
Default: ``true``  
  
####_scrollTo 
Signifies to where trickle should scroll when the relevant step is unlocked.  
``"@block +1"`` - scroll forward to the next block.  
``"@article +2"`` - scroll forward two articles.  
``".className"`` - scroll to the specified classname.  
``"id"`` - scroll to the give id.   
Default: ``"@block +1"``  
  
####_onChildren 
Used when an article should set trickle on all child blocks rather than trickle on the article. Set to ``false`` on the article to use trickle at article level.  
Default: ``true``   
  
###_button
Button attributes group.  
  
####_button._isEnabled
If set to ``false``, no button will be shown, steplocking will work on component completion only and trickle will scroll to the relevant section if ``_autoScroll`` is set to ``true``.  
Default:  ``true``  
  
####_button._styleBeforeCompletion  
Values: ``"hidden"`` | ``"visible"``  
Default: ``"hidden"``  

####_button._styleAfterClick
Values: ``"hidden"`` | ``"disabled"`` | ``"scroll"``  
Default: ``"hidden"``  
  
####_button._isFullWidth``  
Will position the button fixed to the bottom of the window. This option will force ``_stepLocking._isEnabled: true``. The button will fade-out when the users scrolls upwards, away from the bottom of the window when ``_autoHide: true``.  
Default: ``true``  
  
####_button._autoHide  
Will hide the button when it scrolls from view.  Will show the button when it scrolls into view.  
Default: ``true``  
  
####_button._className
Available option: ``"trickle-round-arrow"``  
Default: ``""``  
  
Will add a class to the button container.  
  
``"trickle-round-arrow"`` Will display a round button with an arrow and no text instead of the classic square button with text.  

####_button._text 
Defines the default button text.  
Default: ``"Continue"``  
  
####_button._finalText 
Defines the last item button text when set on the article with ``_onChildren: true``.  
Default: ``true``  

####_.button._component 
Defines the trickle plugin which should handle the interaction. At present only ``"trickle-button"`` is available but it is possible to create new plugins.  
Default: ``"trickle-button"``  
  
###_stepLocking
Steplocking (section hiding) attributes group.  
  
####_stepLocking._isEnabled
Will allow trickle to truncate the page at the step until the user is allowed to move forward.  
Default: ``true``
  
####_stepLocking._isCompletionRequired 
Forces the user to complete the block/article before the step is unlocked. If the block/article is reset on a page revisit, the lock will be reapplied.  
Default: ``true``  
  
####_stepLocking._isLockedOnRevisit
On every page revisit the step will be relocked.  
Default: ``false``

##Limitations
 
To be completed.

##Browser spec

This component has been tested to the standard Adapt browser specification.