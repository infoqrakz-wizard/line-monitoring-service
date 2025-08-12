import React from 'react';
import classes from './Table.module.css';

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
    <div className={classes.tableContainer}>
      <table className={classes.table}>
        <thead className={classes.thead}>
          <tr>
            {columns.map((c) => (
              <th key={String(c.key)} className={classes.th}>
                {c.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((row, i) => (
            <tr key={getKey(row, i, keyField)} className={i % 2 === 0 ? classes.trEven : classes.trOdd}>
              {columns.map((c) => (
                <td key={String(c.key)} className={classes.td}>
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
