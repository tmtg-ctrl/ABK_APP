import { AlertCircle } from 'lucide-react';

export function InlineError({ message }) {
  return (
    <div className="inline-error">
      <AlertCircle size={17} />
      {message}
    </div>
  );
}
