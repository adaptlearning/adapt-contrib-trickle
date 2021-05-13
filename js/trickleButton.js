import Adapt from 'core/js/adapt';
import TrickleButtonView from './TrickleButtonView';
import TrickleButtonModel from './TrickleButtonModel';

export default Adapt.register('trickle-button', {
  view: TrickleButtonView,
  model: TrickleButtonModel
});
