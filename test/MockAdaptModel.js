export default class MockAdaptModel extends Backbone.Model {

  // ensure we have the same baseline data
  defaults() {
    return {
      _canShowFeedback: true,
      _classes: '',
      _canReset: true,
      _canRequestChild: false,
      _isComplete: false,
      _isInteractionComplete: false,
      _isA11yRegionEnabled: false,
      _isA11yCompletionDescriptionEnabled: true,
      _requireCompletionOf: -1,
      _isEnabled: true,
      _isResetOnRevisit: false,
      _isAvailable: true,
      _isOptional: false,
      _isRendered: false,
      _isReady: false,
      _isVisible: true,
      _isVisited: false,
      _isLocked: false,
      _isHidden: false
    };
  }

  get hasManagedChildren() {
    return true;
  }

  getChildren() {
    return this._childrenCollection;
  }

  getParent() {
    return this._parentModel;
  }

  getAncestorModels(shouldIncludeChild) {
    const parents = [];
    let context = this;

    if (shouldIncludeChild) parents.push(context);

    while (context.has('_parentId')) {
      context = context.getParent();
      parents.push(context);
    }

    return parents.length ? parents : null;
  }

  getAvailableChildModels() {
    return this.getChildren().where({
      _isAvailable: true
    });
  }

  getAllDescendantModels(isParentFirst) {

    const descendants = [];

    if (!this.hasManagedChildren) {
      return descendants;
    }

    const children = this.getChildren();

    children.models.forEach(child => {

      if (!child.hasManagedChildren) {
        descendants.push(child);
        return;
      }

      const subDescendants = child.getAllDescendantModels(isParentFirst);
      if (isParentFirst === true) {
        descendants.push(child);
      }

      descendants.push(...subDescendants);

      if (isParentFirst !== true) {
        descendants.push(child);
      }
    });

    return descendants;

  }
}
