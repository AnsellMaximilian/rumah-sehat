const FormError = ({
  errorField,
  errorId,
}: {
  errorField: string[] | undefined;
  errorId: string;
}) => {
  return (
    <div id={errorId} aria-live="polite" aria-atomic="true">
      {errorField &&
        errorField.map((error: string) => (
          <p className="mt-2 text-sm text-red-500" key={error}>
            {error}
          </p>
        ))}
    </div>
  );
};

export default FormError;
