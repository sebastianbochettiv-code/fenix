import { useContext, useRef, useState, type ChangeEvent, type KeyboardEvent } from 'react';

import { LightCopyIconButton } from '@/object-record/record-field/ui/components/LightCopyIconButton';
import { FieldInputEventContext } from '@/object-record/record-field/ui/contexts/FieldInputEventContext';
import { useTextField } from '@/object-record/record-field/ui/meta-types/hooks/useTextField';
import { useRegisterInputEvents } from '@/object-record/record-field/ui/meta-types/input/hooks/useRegisterInputEvents';
import { RecordFieldComponentInstanceContext } from '@/object-record/record-field/ui/states/contexts/RecordFieldComponentInstanceContext';
import { useAvailableComponentInstanceIdOrThrow } from '@/ui/utilities/state/component-state/hooks/useAvailableComponentInstanceIdOrThrow';
import { FieldInputContainer } from '@/ui/field/input/components/FieldInputContainer';

// --- RUT utils ---

const cleanRut = (rut: string) => rut.replace(/[^0-9kK]/g, '').toUpperCase();

const formatRut = (raw: string): string => {
  const clean = cleanRut(raw);
  if (clean.length < 2) return clean;
  const dv = clean.slice(-1);
  const num = clean.slice(0, -1);
  const formatted = num.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  return `${formatted}-${dv}`;
};

const validateRut = (rut: string): boolean => {
  const clean = cleanRut(rut);
  if (clean.length < 2) return false;
  const dv = clean.slice(-1);
  const num = clean.slice(0, -1);
  if (!/^\d+$/.test(num)) return false;
  let sum = 0;
  let mul = 2;
  for (let i = num.length - 1; i >= 0; i--) {
    sum += parseInt(num[i]) * mul;
    mul = mul === 7 ? 2 : mul + 1;
  }
  const mod = sum % 11;
  const expected = mod === 0 ? '0' : mod === 1 ? 'K' : String(11 - mod);
  return dv === expected;
};

type BadgeStatus = 'empty' | 'invalid' | 'valid';

const badgeColor: Record<BadgeStatus, string> = {
  empty: '#94a3b8',
  invalid: '#ef4444',
  valid: '#22c55e',
};

// --- Component ---

export const RutFieldInput = () => {
  const { fieldDefinition, draftValue, setDraftValue } = useTextField();
  const { onEnter, onEscape, onClickOutside, onTab, onShiftTab } = useContext(
    FieldInputEventContext,
  );
  const instanceId = useAvailableComponentInstanceIdOrThrow(
    RecordFieldComponentInstanceContext,
  );

  const initialValue = formatRut(draftValue ?? '');
  const [displayValue, setDisplayValue] = useState(initialValue);

  const inputRef = useRef<HTMLInputElement>(null);
  const copyRef = useRef<HTMLDivElement>(null);

  // Recalculate status on every render (displayValue changes on typing)
  const clean = cleanRut(displayValue);
  const status: BadgeStatus =
    clean.length < 2 ? 'empty' : validateRut(displayValue) ? 'valid' : 'invalid';

  const isValidOrEmpty = status === 'valid' || status === 'empty';

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    const passThrough = [
      'Backspace', 'Delete', 'ArrowLeft', 'ArrowRight',
      'ArrowUp', 'ArrowDown', 'Home', 'End', 'Tab', 'Enter', 'Escape',
    ];
    if (e.ctrlKey || e.metaKey || passThrough.includes(e.key)) return;
    if (!/^[0-9kK]$/.test(e.key)) e.preventDefault();
  };

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const clean = cleanRut(e.target.value);
    const formatted = clean.length >= 2 ? formatRut(clean) : clean;
    setDisplayValue(formatted);
    setDraftValue(formatted);
    requestAnimationFrame(() => {
      inputRef.current?.setSelectionRange(formatted.length, formatted.length);
    });
  };

  const handleEnter = (val: string) => {
    if (!isValidOrEmpty) {
      // Prevent save and keep input open on invalid RUT (Enter should not save bad RUT)
      inputRef.current?.focus();
      return;
    }
    onEnter?.({ newValue: val.trim() });
  };
  const handleEscape = (val: string) => {
    // Always allow Escape to close WITHOUT saving (prevents saving bad RUT)
    onEscape?.({ newValue: '' }); // Force empty to avoid persisting bad value
  };
  const handleClickOutside = (event: MouseEvent | TouchEvent, val: string) => {
    if (!isValidOrEmpty) {
      // Prevent save and keep input open on invalid RUT
      inputRef.current?.focus();
      return;
    }
    onClickOutside?.({ newValue: val.trim(), event });
  };
  const handleTab = (val: string) => {
    if (!isValidOrEmpty) {
      // Prevent save and keep input open on invalid RUT
      inputRef.current?.focus();
      return;
    }
    onTab?.({ newValue: val.trim() });
  };
  const handleShiftTab = (val: string) => {
    if (!isValidOrEmpty) {
      // Prevent save and keep input open on invalid RUT
      inputRef.current?.focus();
      return;
    }
    onShiftTab?.({ newValue: val.trim() });
  };

  useRegisterInputEvents({
    focusId: instanceId,
    inputRef,
    copyRef,
    inputValue: displayValue,
    onEnter: handleEnter,
    onEscape: handleEscape,
    onClickOutside: handleClickOutside,
    onTab: handleTab,
    onShiftTab: handleShiftTab,
  });

  return (
    <FieldInputContainer>
      <div style={{ display: 'flex', alignItems: 'center', width: '100%', position: 'relative' }}>
        <input
          ref={inputRef}
          id={instanceId}
          autoComplete="off"
          autoFocus
          placeholder={fieldDefinition.metadata.placeHolder ?? '12.345.678-9'}
          value={displayValue}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          style={{
            background: 'transparent',
            border: 'none',
            color: '#ffffff',
            fontFamily: 'inherit',
            fontSize: 'inherit',
            fontWeight: 'inherit',
            margin: 0,
            outline: 'none',
            padding: '0 8px',
            width: '100%',
          }}
        />
        <span
          style={{
            borderRadius: '50%',
            width: 8,
            height: 8,
            backgroundColor: badgeColor[status],
            flexShrink: 0,
            marginRight: 4,
          }}
        />
        {!isValidOrEmpty && (
          <span
            style={{
              color: '#ef4444',
              fontSize: '12px',
              marginLeft: '8px',
              whiteSpace: 'nowrap',
              flexShrink: 0,
            }}
          >
            Ingrese RUT válido
          </span>
        )}
        <div ref={copyRef}>
          <LightCopyIconButton copyText={displayValue} />
        </div>
      </div>
    </FieldInputContainer>
  );
};
