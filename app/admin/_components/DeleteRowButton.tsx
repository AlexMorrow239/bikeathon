'use client';

interface DeleteRowButtonProps {
  action: () => void | Promise<void>;
  confirmMessage: string;
  label: string;
  disabledReason?: string;
}

const BASE_BUTTON_CLASS = 'inline-flex items-center justify-center rounded p-1.5';

export default function DeleteRowButton({
  action,
  confirmMessage,
  label,
  disabledReason,
}: DeleteRowButtonProps) {
  const disabled = disabledReason !== undefined;
  return (
    <form
      action={action}
      onSubmit={(e) => {
        if (disabled || !confirm(confirmMessage)) e.preventDefault();
      }}
      className="inline-flex"
    >
      <button
        type="submit"
        aria-disabled={disabled || undefined}
        title={disabledReason ?? 'Delete'}
        aria-label={label}
        className={
          disabled
            ? `${BASE_BUTTON_CLASS} text-gray-300 cursor-not-allowed`
            : `${BASE_BUTTON_CLASS} text-gray-400 hover:text-error-600 hover:bg-error-100`
        }
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 16 16"
          width="16"
          height="16"
          fill="currentColor"
          aria-hidden="true"
        >
          <path d="M6.5 1a.5.5 0 0 0-.5.5V2H3a1 1 0 0 0 0 2h.117l.74 9.252A2 2 0 0 0 5.852 15h4.296a2 2 0 0 0 1.995-1.748L12.883 4H13a1 1 0 1 0 0-2h-3v-.5a.5.5 0 0 0-.5-.5h-3Zm-1.385 3h5.77l-.72 9.002a1 1 0 0 1-.998.998H6.833a1 1 0 0 1-.998-.998L5.115 4Zm1.635 1.75a.5.5 0 0 1 .5.5v6a.5.5 0 0 1-1 0v-6a.5.5 0 0 1 .5-.5Zm2.5 0a.5.5 0 0 1 .5.5v6a.5.5 0 0 1-1 0v-6a.5.5 0 0 1 .5-.5Z" />
        </svg>
      </button>
    </form>
  );
}
