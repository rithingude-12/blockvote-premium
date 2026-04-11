import React from 'react';
import './Table.css';

const Table = ({ headers, data, renderRow }) => {
  return (
    <div className="apple-table-container">
      <table className="apple-table">
        <thead>
          <tr>
            {headers.map((h, i) => (
              <th key={i}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((row, index) => renderRow(row, index))}
        </tbody>
      </table>
    </div>
  );
};

export default Table;
