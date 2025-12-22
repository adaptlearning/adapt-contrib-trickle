import Adapt from 'core/js/adapt';
import controller from './controller';
import models from './models';
import trickleButton from './trickleButton';
import TrickleButtonModel from './TrickleButtonModel';
import TrickleButtonView from './TrickleButtonView';
import { getTrickleButtonHeight } from './helpers';

controller.getTrickleButtonHeight = getTrickleButtonHeight;
export default (Adapt.trickle = controller);

export {
  controller,
  models,
  trickleButton,
  TrickleButtonModel,
  TrickleButtonView,
  getTrickleButtonHeight
};
