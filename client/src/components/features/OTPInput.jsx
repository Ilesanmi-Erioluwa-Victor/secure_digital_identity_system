import { useRef, useCallback, useEffect } from 'react';

export default function OTPInput({
  length = 6,
  value = '',
  onChange,
  error,
  disabled = false,
}) {
  const inputsRef = useRef([]);

  const updateValue = useCallback(
    (newVal) => {
      const digits = newVal.replace(/\D/g, '').slice(0, length);
      onChange?.(digits);
    },
    [length, onChange]
  );

  const handleChange = (index, e) => {
    const char = e.target.value.replace(/\D/g, '').slice(-1);
    if (!char) return;
    const newVal = value.split('');
    newVal[index] = char;
    const joined = newVal.join('');
    onChange?.(joined);
    if (index < length - 1 && inputsRef.current[index + 1]) {
      inputsRef.current[index + 1].focus();
    }
  };

  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace') {
      e.preventDefault();
      const newVal = value.split('');
      if (value[index]) {
        newVal[index] = '';
        onChange?.(newVal.join(''));
      } else if (index > 0) {
        newVal[index - 1] = '';
        onChange?.(newVal.join(''));
        inputsRef.current[index - 1]?.focus();
      }
    } else if (e.key === 'ArrowLeft' && index > 0) {
      inputsRef.current[index - 1]?.focus();
    } else if (e.key === 'ArrowRight' && index < length - 1) {
      inputsRef.current[index + 1]?.focus();
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, length);
    if (pasted.length > 0) {
      updateValue(pasted);
      const focusIdx = Math.min(pasted.length, length - 1);
      inputsRef.current[focusIdx]?.focus();
    }
  };

  useEffect(() => {
    inputsRef.current[0]?.focus();
  }, []);

  const digits = value.split('').concat(Array(length - value.length).fill(''));

  return (
    <div className="w-full">
      <div className="flex items-center justify-center gap-2">
        {digits.map((digit, index) => (
          <input
            key={index}
            ref={(el) => (inputsRef.current[index] = el)}
            type="text"
            inputMode="numeric"
            maxLength={1}
            value={digit}
            disabled={disabled}
            onPaste={handlePaste}
            onChange={(e) => handleChange(index, e)}
            onKeyDown={(e) => handleKeyDown(index, e)}
            className={`w-12 h-14 text-center text-2xl font-bold border rounded-lg bg-white transition-colors ${
              error
                ? 'border-status-revoked focus:ring-red-200 focus:border-status-revoked'
                : 'border-neutral-300 focus:ring-primary/20 focus:border-primary'
            } focus:outline-none focus:ring-2 disabled:opacity-50 disabled:cursor-not-allowed`}
          />
        ))}
      </div>
      {error && (
        <p className="mt-2 text-sm text-status-revoked text-center">{error}</p>
      )}
    </div>
  );
}
