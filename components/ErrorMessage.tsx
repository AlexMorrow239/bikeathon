interface ErrorMessageProps {
  message: string;
}

export function ErrorMessage({ message }: ErrorMessageProps) {
  return (
    <div className="p-3 bg-red-100 border border-red-400 text-red-700 rounded">
      {message}
    </div>
  );
}