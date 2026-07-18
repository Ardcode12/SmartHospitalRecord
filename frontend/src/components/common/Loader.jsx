import React from 'react';

export default function Loader({ fullPage }) {
  if (fullPage) {
    return (
      <div style={{ display:'flex', alignItems:'center', justifyContent:'center', minHeight:'100vh' }}>
        <div className="spinner" />
      </div>
    );
  }
  return (
    <div className="loader-overlay">
      <div className="spinner" />
    </div>
  );
}
