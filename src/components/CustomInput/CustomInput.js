import React, { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { colors } from '../../theme';
import './CustomInput.css';

const CustomInput = ({
  id,
  type = 'text',
  label,
  error = false,
  errorMessage,
  containerStyle,
  onChange,
  value,
  placeholder,
  onBlur,
  ...rest
}) => {
  const [showPassword, setShowPassword] = useState(false);
  const [isFocused, setIsFocused] = useState(false);

  const isPassword = type === 'password';
  const inputType = isPassword ? (showPassword ? 'text' : 'password') : type;

  const handleChange = (e) => {
    if (onChange) {
      onChange(e.target.value);
    }
  };

  const handleFocus = () => {
    setIsFocused(true);
  };

  const handleBlur = (e) => {
    setIsFocused(false);
    if (onBlur) {
      onBlur(e);
    }
  };

  return (
    <div className="custom-input-container" style={containerStyle}>
      {label && <label className="custom-input-label">{label}</label>}
      <div
        className={`custom-input-wrapper ${isFocused ? 'focused' : ''} ${error ? 'error' : ''}`}
      >
        <input
          id={id}
          type={inputType}
          className="custom-input"
          value={value}
          placeholder={placeholder}
          onChange={handleChange}
          onFocus={handleFocus}
          onBlur={handleBlur}
          autoCapitalize={type === 'email' ? 'none' : 'sentences'}
          autoCorrect="off"
          {...rest}
        />
        {isPassword && (
          <button
            type="button"
            className="custom-input-eye"
            onClick={() => setShowPassword(!showPassword)}
          >
            {showPassword ? (
              <EyeOff color={colors.textMuted} size={20} />
            ) : (
              <Eye color={colors.textMuted} size={20} />
            )}
          </button>
        )}
      </div>
      {error && errorMessage && (
        <span className="custom-input-error">{errorMessage}</span>
      )}
    </div>
  );
};

export default CustomInput;
