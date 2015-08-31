# adapt-contrib-trickle  

**Trickle** is an *extension* bundled with the [Adapt framework](https://github.com/adaptlearning/adapt_framework).  

<img src="https://github.com/adaptlearning/documentation/blob/master/04_wiki_assets/plug-ins/images/trickle01.gif" alt="trickle in action">

The **Trickle** extension determines what portion of a page is presented to a learner and when the learner may advance to the next section. Using **Trickle**, a course author may hide/lock the portion of a page that follows an article or a block. A button may be displayed at the end of the visible portion; clicking this button releases the lock and scrolls the page to the next portion. If no button is displayed, the next section will unlock automatically once the current section has been completed by the user. 

Properties that can be configured include: requiring completion of components before advancing, whether a button should be shown or not, the style of button and the text that labels it, whether the user is scrolled to the next section automatically or not, and step-locking behaviour upon revisit.

[Visit the **Trickle** wiki](https://github.com/adaptlearning/adapt-contrib-trickle/wiki) for more information about its functionality and for explanations of key properties. 



##Installation

As one of Adapt's *[core extensions](https://github.com/adaptlearning/adapt_framework/wiki/Core-Plug-ins-in-the-Adapt-Learning-Framework#extensions),* **Trickle** is included with the [installation of the Adapt framework](https://github.com/adaptlearning/adapt_framework/wiki/Manual-installation-of-the-Adapt-framework#installation) and the [installation of the Adapt authoring tool](https://github.com/adaptlearning/adapt_authoring/wiki/Installing-Adapt-Origin).

* If **Trickle** has been uninstalled from the Adapt framework, it may be reinstalled.
With the [Adapt CLI](https://github.com/adaptlearning/adapt-cli) installed, run the following from the command line:  
`adapt install adapt-contrib-trickle`

    Alternatively, this extension can also be installed by adding the following line of code to the *adapt.json* file:  
    `"adapt-contrib-trickle": "*"`  
    Then running the command:  
    `adapt install`  
    (This second method will reinstall all plug-ins listed in *adapt.json*.)  

* If **Trickle** has been uninstalled from the Adapt authoring tool, it may be reinstalled using the [Plug-in Manager](https://github.com/adaptlearning/adapt_authoring/wiki/Plugin-Manager).

## Settings Overview

**Trickle** may be configured on two levels: article (*articles.json*) and block (*blocks.json*). The **_onChildren** attribute determines whether the configuration applies only to the article or to the article's blocks. Attributes set in a child block override those set by its parent article. The attributes listed below are properly formatted as JSON in [*example.json*](https://github.com/adaptlearning/adapt-contrib-trickle/blob/master/example.json). _(**Trickle** may also be added to_ course.json _as a simple switch to enable/disable **Trickle** during development. Its attributes will not be inherited by its child elements.)_ Visit the [**Trickle** wiki](https://github.com/adaptlearning/adapt-contrib-trickle/wiki) for more information about how they appear in the [authoring tool](https://github.com/adaptlearning/adapt_authoring/wiki).

### Attributes

**_trickle** (object): The Trickle attributes group contains values for **_isEnabled**, **_scrollDuration**, **_autoScroll**, **_scrollTo**, **_onChildren**, **_button**, and **_stepLocking**.

>**_isEnabled** (boolean):  Turns on and off the **Trickle** extension. Can be set in *course.json*, *articles.json* and *blocks.json* to disable **Trickle** where not required. Also useful during course development. 
  
>**_scrollDuration** (number):  This number specifies the duration of the scroll animation in milliseconds. The default is `500`.  
  
>**_autoScroll** (boolean):  If set to `true`, the page will scroll automatically to the destination specified in **_scrollTo** when the button is clicked. The learner must manually scroll if this is set to `false`. The default is `true`.  
  
>**_scrollTo** (string):  This value determines the destination to which **Trickle** should scroll when the relevant step is unlocked. Acceptable values must be formulated according to one of the models listed below. The default is `"@block +1"`.      
- `"@block +1"` - Scroll forward to the next block. 
- `"@article +2"` - Scroll forward two articles. 
- `".className"` - Scroll to the specified classname. 
- `"id"` - Scroll to the given ID.   
 
>**_onChildren** (boolean):  Determines whether the Trickle settings should be applied to the article alone or if it should apply to its blocks. When set to `true` on an article, the article's Trickle settings do not apply to the article; rather, the settings act as the default Trickle settings for all the blocks contained by the article. When set to `false`, the settings act on the article itself. The default is `true`. (N.B. this attribute is ignored if set on a block.)   
  
>**_button** (object): The button that releases the lock on hidden elements is commonly called the Trickle button. This `_button` attributes group stores the properties for the Trickle button. It contains values for **_isEnabled**, **_styleBeforeCompletion**, **_styleAfterClick**, **_isFullWidth**, **_autoHide**, **_className**, **text**, **finalText**, and **_component**.  
  
>>**_isEnabled** (boolean):  If set to `false`, no button is displayed, so step-locking is triggered by component completion only. The page will scroll to the specified destination if **_autoScroll** is set to `true`. The default is `true`.  
  
>>**_styleBeforeCompletion** (string):  Determines whether the Trickle button is visible even while subsequent sections of the page remain inaccessible. Acceptable values are `"hidden"` and `"visible"`. The default is `"hidden"`.  

>>**_styleAfterClick** (string): Determines the properties of the Trickle button after it has been clicked. Acceptable values are `"hidden"`, `"disabled"`, and `"scroll"`. `"hidden"` hides the button. `"disabled"` applies the "disabled" CSS class. The value `"scroll"` will cause the button to maintain its visibility allowing the user an alternative method for scrolling down the page by using the button (even after all sections have been revealed). The default is `"hidden"`.  
  
>>**_isFullWidth** (boolean):  Will position the button fixed to the bottom of the window. This option will force to `true`  **_isEnabled** in the **_stepLocking** attribute group (**_stepLocking._isEnabled: true**). When **_autoHide** is set to `true`, the button will fade-out when the learner scrolls up, away from the button. The default is `true`.  
  
>>**_autoHide** (boolean):  Will hide the button when it scrolls from view.  Will show the button when it scrolls into view. The default is `true`. 
  
>>**_className** (string):  Will add a class to the button container. Available option: `"trickle-round-arrow"`. `"trickle-round-arrow"` displays a round button with an arrow and no text instead of the classic square button with text. The default is `""`.  
  
>>**text** (string):  Defines the default button text. The default is `"Continue"`.  
  
>>**finalText** (string):  Defines the last item button text when set on the article with **_onChildren** set to `true`. The default is `"Finish"`.  

>>**_component** (string):  Defines the Trickle plug-in which should handle the interaction. At present only `"trickle-button"` is available, but it is possible to create new plug-ins. The default is `"trickle-button"`.  
  
>**_stepLocking** (object):  Step locking (section hiding) attributes group contains values for **_isEnabled**, **_isCompletionRequired**, and **_isLockedOnRevisit**.  
  
>>**_isEnabled** (boolean):  Will allow Trickle to truncate the page at the step until the user is allowed to move forward. The default is `true`.  
  
>>**_isCompletionRequired** (boolean):  Forces the user to complete the block/article before the step is unlocked. If the block/article is reset on a page revisit, the lock will be reapplied. The default is `true`.  
  
>>**_isLockedOnRevisit** (boolean):  On every page revisit the step will be relocked. The default is `false`.  

## Limitations

No known limitations.  

----------------------------
**Version number:**  2.0   <a href="https://community.adaptlearning.org/" target="_blank"><img src="https://github.com/adaptlearning/documentation/blob/master/04_wiki_assets/plug-ins/images/adapt-logo-mrgn-lft.jpg" alt="adapt learning logo" align="right"></a> 
**Framework versions:**  2.0     
**Author / maintainer:** Adapt Core Team with [contributors](https://github.com/adaptlearning/adapt-contrib-trickle/graphs/contributors)    
**Accessibility support:** WAI AA   
**RTL support:** yes  
**Cross-platform coverage:** Chrome, Chrome for Android, Firefox (ESR + latest version), IE 11, IE10, IE9, IE8, IE Mobile 11, Safari for iPhone (iOS 7+8), Safari for iPad (iOS 7+8), Safari 8, Opera    
