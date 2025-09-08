import React from "react";

export default function FormularioBase({
  fields,
  onSubmit,
  submitLabel = "Guardar",
}: {
  fields: { name: string; label: string; type?: string; required?: boolean }[];
  onSubmit: (values: Record<string, unknown>) => void;
  submitLabel?: string;
}) {
  const [values, setValues] = React.useState<Record<string, unknown>>({});

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    setValues((v) => ({ ...v, [e.target.name]: e.target.value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(values);
  };

  return (
    <form
      className="bg-white dark:bg-zinc-900 p-4 rounded shadow flex flex-col gap-4 max-w-lg mx-auto"
      onSubmit={handleSubmit}
    >
      {fields.map((f) => (
        <div key={f.name} className="flex flex-col gap-1">
          <label className="font-medium text-sm" htmlFor={f.name}>
            {f.label}
          </label>
          <input
            id={f.name}
            name={f.name}
            type={f.type || "text"}
            required={f.required}
            className="border p-2 rounded"
            onChange={handleChange}
          />
        </div>
      ))}
      <button
        type="submit"
        className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 font-semibold"
      >
        {submitLabel}
      </button>
    </form>
  );
}
