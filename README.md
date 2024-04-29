# adapt-contrib-trickle

**Trickle** is an *extension* bundled with the [Adapt framework](https://github.com/adaptlearning/adapt_framework).

<img src="https://github.com/adaptlearning/documentation/blob/master/04_wiki_assets/plug-ins/images/trickle01.gif" alt="trickle in action">

The **Trickle** extension determines what portion of a page is presented to a learner and when the learner may advance to the next section. Using **Trickle**, a course author may hide/lock the portion of a page that follows an article or a block. A button may be displayed at the end of the visible portion; clicking this button releases the lock and scrolls the page to the next portion. If no button is displayed, the next section will unlock automatically once the current section has been completed by the user.

Properties that can be configured include: requiring completion of components before advancing, whether a button should be shown or not, the style of button and the text that labels it, whether the user is scrolled to the next section automatically or not, and step-locking behaviour upon revisit.

[Visit the **Trickle** wiki](https://github.com/adaptlearning/adapt-contrib-trickle/wiki) for more information about its functionality and for explanations of key properties.

## Installation

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

- **Trickle** may be configured on two levels: article (*articles.json*) and block (*blocks.json*). The **\_onChildren** attribute determines whether the configuration applies only to the article or to the article's blocks. Attributes set in a child block override those set by its parent article.
- The default value of **\_completionAttribute** may be overridden on _config.json_.
- _**Trickle** may also be added to_ config.json _as a simple switch to enable/disable **Trickle** during development. Its attributes will not be inherited by its child elements._

The attributes listed below are properly formatted as JSON in [*example.json*](https://github.com/adaptlearning/adapt-contrib-trickle/blob/master/example.json).  Visit the [**Trickle** wiki](https://github.com/adaptlearning/adapt-contrib-trickle/wiki) for more information about how they appear in the [authoring tool](https://github.com/adaptlearning/adapt_authoring/wiki).

### Attributes

**\_trickle** (object): The Trickle attributes group contains values for **\_isEnabled**, **\_autoScroll**, **\_scrollDuration**, **\_onChildren**, **\_scrollTo**, **\_button**, and **\_stepLocking**.

>**\_isEnabled** (boolean):  Turns on and off the **Trickle** extension. Can be set in *config.json*, *articles.json* and *blocks.json* to disable **Trickle** where not required. Also useful to disable during course development.

>**\_isInherited** (boolean):  If set to `true`, the block settings will inherit from the parent article. The default is `false`.

>**\_autoScroll** (boolean):  If set to `true`, the page will scroll automatically to the destination specified in **\_scrollTo** when the button is clicked. The learner must manually scroll if this is set to `false`. The default is `true`.

>**\_scrollDuration** (number):  This number specifies the duration of the scroll animation in milliseconds. The default is `500`.

>**\_onChildren** (boolean):  Determines whether the Trickle settings should be applied to the article alone or if it should apply to its blocks. When set to `true` on an article, the article's Trickle settings do not apply to the article; rather, the settings act as the default Trickle settings for all the blocks contained by the article. When set to `false`, the settings act on the article itself. The default is `true`. (N.B. this attribute is ignored if set on a block.)

>**\_scrollTo** (string):  This value determines the destination to which **Trickle** should scroll when the relevant step is unlocked. Acceptable values must be formulated according to one of the models listed below. The default is `"@block +1"`.
- `"@block +1"` - Scroll forward to the next block.
- `"@article +2"` - Scroll forward two articles.
- `".className"` - Scroll to the specified classname.
- `"id"` - Scroll to the given ID.

>**\_button** (object): The button that releases the lock on hidden elements is commonly called the Trickle button. This `_button` attributes group stores the properties for the Trickle button. It contains values for **\_isEnabled**, **\_styleBeforeCompletion**, **\_styleAfterClick**, **\_isFullWidth**, **\_autoHide**, **\_className**, **\_hasIcon**, **text**, **startText**, **finalText**, and **\_component**.

>>**\_isEnabled** (boolean):  If set to `false`, no button is displayed, so step-locking is triggered by component completion only. The page will scroll to the specified destination if **\_autoScroll** is set to `true`. The default is `true`.

>>**\_styleBeforeCompletion** (string):  Determines whether the Trickle button is visible even while subsequent sections of the page remain inaccessible. Acceptable values are `"hidden"`, `"disabled"`, and `"visible"`. The default is `"hidden"`.

>>**\_styleAfterClick** (string): Determines the properties of the Trickle button after it has been clicked. Acceptable values are `"hidden"`, `"disabled"`, and `"visible"`. `"hidden"` hides the button. `"disabled"` applies the "disabled" CSS class. The value `"visible"` will cause the button to maintain its visibility allowing the user an alternative method for scrolling down the page by using the button (even after all sections have been revealed). The default is `"hidden"`.

>>**\_isFullWidth** (boolean):  Will position the button fixed to the bottom of the window. This option will force to `true`  **\_isEnabled** in the **\_stepLocking** attribute group (**\_stepLocking.\_isEnabled: true**). When **\_autoHide** is set to `true`, the button will fade-out when the learner scrolls up, away from the button. The default is `true`.

>>**\_autoHide** (boolean):  Will hide the button when it scrolls from view.  Will show the button when it scrolls into view. The default is `false`. If you require your course to be accessible, you should set this to `false` to ensure compatibility with screen readers.

>>**\_className** (string):  Will add a class to the button container. The default is `""`.

>>**\_hasIcon_** (boolean):  Will add an icon to the button. Default icon is a small downwards arrow that appears to the side of the text. Can be used in conjunction with `text`, `startText`, and `finalText` but can also be used on its own. The default is `false`.

>>**text** (string):  Defines the default button text. The default is `"Continue"`.

>>**ariaLabel** (string):  Defines the default button aria label. The default is `""`.

>>**disabledText** (string):  Defines the default button text when the button is disabled. If not set, `startText`, `finalText` or `text` will be used in that order. `_styleBeforeCompletion` must be set to `visible` so that the button is shown while disabled. The default is `""`.

>>**disabledAriaLabel** (string):  Defines the button aria label when using `disabledText`. The default is `""`.

>>**startText** (string):  Defines the first item button text when set on the article with **\_onChildren** set to `true`. The default is `"Begin"`.

>>**startAriaLabel** (string):  Defines the first item button aria label when set on the article with **\_onChildren** set to `true`. The default is `""`.

>>**finalText** (string):  Defines the last item button text when set on the article with **\_onChildren** set to `true`. The default is `"Finish"`.

>>**finalAriaLabel** (string):  Defines the last item button aria label when set on the article with **\_onChildren** set to `true`. The default is `""`.

>>**\_component** (string):  Defines the Trickle plug-in which should handle the interaction. At present only `"trickle-button"` is available, but it is possible to create new plug-ins. The default is `"trickle-button"`.

>>**\_showEndOfPage** (boolean):  When set to `false`, hides any end-of-page button. The default is `true`.

>**\_stepLocking** (object):  Step locking (section hiding) attributes group contains values for **\_isEnabled**, **\_isCompletionRequired**, and **\_isLockedOnRevisit**.

>>**\_isEnabled** (boolean):  Will allow Trickle to truncate the page at the step until the user is allowed to move forward. The default is `true`. Note that if **\_isFullWidth** is set to `true` on the **\_button** attribute group (see above), **\_isEnabled** will be forced to `true` regardless of what you set here.

>>**\_isCompletionRequired** (boolean):  Forces the user to complete the block/article before the step is unlocked. If the block/article is reset on a page revisit, the lock will be reapplied. The default is `true`.

>>**\_isLockedOnRevisit** (boolean):  On every page revisit the step will be relocked. The default is `false`.

The following attribute can be added to *config.json* to overide which completion data attribute is used to test when the trickle button should be displayed.

>**\_completionAttribute** (string): Defines which completion attribute is used to test when the trickle button should be displayed. As of v2.1.4 of this plugin, the default is `"_isComplete"`; in previous versions it defaulted to `"_isInteractionComplete"`. Unless you want to do something like 'soft reset' the assessment and still have it be trickled, it's unlikely you'll need to change this setting from the new default.

## Limitations

No known limitations.

----------------------------
<a href="https://community.adaptlearning.org/" target="_blank"><img src="https://github.com/adaptlearning/documentation/blob/master/04_wiki_assets/plug-ins/images/adapt-logo-mrgn-lft.jpg" alt="adapt learning logo" align="right"></a>
**Author / maintainer:** Adapt Core Team with [contributors](https://github.com/adaptlearning/adapt-contrib-trickle/graphs/contributors)<br>
**Accessibility support:** WAI AA<br>
**RTL support:** Yes<br>
**Cross-platform coverage:** Chrome, Chrome for Android, Firefox (ESR + latest version), Edge, IE11, Safari 14 for macOS/iOS/iPadOS, Opera<br>
