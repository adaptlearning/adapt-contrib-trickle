import Adapt from 'core/js/adapt';
import controller from './controller';
import models from './models';
import trickleButton from './trickleButton';
import TrickleButtonModel from './TrickleButtonModel';
import TrickleButtonView from './TrickleButtonView';

// Export main API
export default (Adapt.trickle = controller);

// Export everything
export {
  controller,
  models,
  trickleButton,
  TrickleButtonModel,
  TrickleButtonView
};
