import React from "react";

export default function TablaBase({
  columns,
  data,
}: {
  columns: string[];
  data: Record<string, unknown>[];
}) {
  return (
    <div className="table-wrapper border rounded-lg border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900">
      <table className="table-base">
        <thead>
          <tr>
            {columns.map((c) => (
              <th
                key={c}
                className="bg-zinc-50 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-200 font-semibold"
              >
                {c}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.length === 0 ? (
            <tr>
              <td
                colSpan={columns.length}
                className="text-center text-zinc-500 py-6"
              >
                Sin registros
              </td>
            </tr>
          ) : (
            data.map((row, idx) => (
              <tr
                key={idx}
                className="hover:bg-zinc-50/60 dark:hover:bg-zinc-800/50"
              >
                {columns.map((c) => (
                  <td key={c} className="break-anywhere">
                    {String(row[c] ?? "")}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
