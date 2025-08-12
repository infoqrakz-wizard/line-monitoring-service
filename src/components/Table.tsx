import React from 'react';

export type TableColumn<T> = {
  key: keyof T | string;
  header: string;
  render?: (row: T) => React.ReactNode;
};

export type TableProps<T> = {
  columns: TableColumn<T>[];
  data: T[];
  keyField?: keyof T | ((row: T, index: number) => string);
};

function getKey<T>(row: T, index: number, keyField?: keyof T | ((row: T, index: number) => string)) {
  if (typeof keyField === 'function') return keyField(row, index);
  if (keyField) return String((row as any)[keyField]);
  return String(index);
}

export const Table = <T,>({ columns, data, keyField }: TableProps<T>) => {
  if (!columns.length) return null;
  return (
    <div className="overflow-x-auto border rounded">
      <table className="min-w-full text-sm">
        <thead className="bg-gray-50">
          <tr>
            {columns.map((c) => (
              <th key={String(c.key)} className="text-left px-3 py-2 font-medium text-gray-700 border-b">
                {c.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((row, i) => (
            <tr key={getKey(row, i, keyField)} className="odd:bg-white even:bg-gray-50">
              {columns.map((c) => (
                <td key={String(c.key)} className="px-3 py-2 border-b">
                  {c.render ? c.render(row) : String((row as any)[c.key as any] ?? '')}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default Table;
