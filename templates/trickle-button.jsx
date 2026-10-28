import React from 'react';
import { classes } from 'core/js/reactHelpers';

export default function TrickleButton(props) {
  const {
    _trickle,
    _globals,
    _isButtonVisible,
    _isButtonAutoHidden,
    _isButtonDisabled,
    _isIncompleteContentLabelDisabled,
    buttonText,
    buttonAriaLabel,
    onButtonClick
  } = props;
  const _button = _trickle?._button;
  const isButtonHidden = !_isButtonVisible || _isButtonAutoHidden;
  const isButtonLocked = _isButtonDisabled && _isButtonVisible;

  return (
    <>
      {/* Matches a11y.toggleAccessibleEnabled(label, false) once the button unlocks */}
      <div
        className={classes([
          'aria-label',
          _isIncompleteContentLabelDisabled && 'aria-hidden is-disabled'
        ])}
        aria-hidden={_isIncompleteContentLabelDisabled ? 'true' : undefined}
        aria-disabled={_isIncompleteContentLabelDisabled ? 'true' : undefined}
        tabIndex={_isIncompleteContentLabelDisabled ? '-1' : undefined}
        dangerouslySetInnerHTML={{ __html: _globals?._extensions?._trickle?.incompleteContent || '' }}
      />

      <div
        className={classes([
          'trickle__inner',
          'js-trickle-btn-container',
          `${_button?._component}__inner`,
          isButtonHidden && 'u-display-none'
        ])}
      >

        <button
          aria-label={buttonAriaLabel || undefined}
          className={classes([
            'trickle__btn',
            'js-trickle-btn',
            _isButtonDisabled && 'is-disabled',
            isButtonLocked && 'is-locked',
            _button?._hasIcon && 'btn-icon',
            buttonText && 'btn-text'
          ])}
          aria-disabled={_isButtonDisabled ? 'true' : undefined}
          onClick={onButtonClick}
        >

          {_button?._hasIcon &&
          <span className='trickle__btn-icon'>
            <span className='icon' aria-hidden='true' />
          </span>
          }

          {buttonText &&
          <span className='trickle__btn-text'>
            <span
              className='trickle__btn-text-inner js-trickle-btn-text'
              dangerouslySetInnerHTML={{ __html: buttonText }}
            />
          </span>
          }

        </button>

      </div>
    </>
  );
}
