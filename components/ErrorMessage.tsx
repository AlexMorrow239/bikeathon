interface ErrorMessageProps {
  message: string;
}

export default function ErrorMessage({ message }: ErrorMessageProps) {
  return (
    <div className="p-3 bg-error-100 border border-error-400 text-error-700 rounded" role="alert">
      {message}
    </div>
  );
}
