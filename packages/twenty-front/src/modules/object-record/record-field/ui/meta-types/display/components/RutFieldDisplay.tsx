import { useTextFieldDisplay } from '@/object-record/record-field/ui/meta-types/hooks/useTextFieldDisplay';
import { TextDisplay } from '@/ui/field/display/components/TextDisplay';

const cleanRut = (rut: string) => rut.replace(/[^0-9kK]/g, '').toUpperCase();

const formatRut = (raw: string): string => {
  const clean = cleanRut(raw);
  if (clean.length < 2) return clean;
  const dv = clean.slice(-1);
  const num = clean.slice(0, -1);
  const formatted = num.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  return `${formatted}-${dv}`;
};

export const RutFieldDisplay = () => {
  const { fieldValue } = useTextFieldDisplay();
  const displayValue = fieldValue ? formatRut(fieldValue) : '';
  return <TextDisplay text={displayValue} />;
};
