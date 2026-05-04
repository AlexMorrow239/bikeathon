export const ADMIN_INPUT_CLASS =
  'block w-full rounded border border-gray-300 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500';

interface AdminFormFieldProps {
  label: string;
  name: string;
  htmlFor?: string;
  error?: string;
  hint?: string;
  required?: boolean;
  children: React.ReactNode;
}

export default function AdminFormField({
  label,
  htmlFor,
  name,
  error,
  hint,
  required,
  children,
}: AdminFormFieldProps) {
  const id = htmlFor ?? name;
  return (
    <div className="space-y-1">
      <label htmlFor={id} className="block text-sm font-medium text-gray-700">
        {label}
        {required ? <span className="ml-1 text-error-600">*</span> : null}
      </label>
      {children}
      {hint ? <p className="text-xs text-gray-500">{hint}</p> : null}
      {error ? <p className="text-xs text-error-700">{error}</p> : null}
    </div>
  );
}
