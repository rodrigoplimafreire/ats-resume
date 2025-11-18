import React from 'react';

const PrintIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    fill="none" 
    viewBox="0 0 24 24" 
    strokeWidth={1.5} 
    stroke="currentColor" 
    {...props}
  >
    <path strokeLinecap="round" strokeLinejoin="round" d="M6.72 13.829c-.24.03-.48.062-.72.096m.72-.096a42.415 42.415 0 0110.56 0m-10.56 0L6 18.25m0 0a2.25 2.25 0 002.25 2.25h8.5a2.25 2.25 0 002.25-2.25m-13.5 0-1.06-3.179a2.25 2.25 0 012.15-2.92h12.156a2.25 2.25 0 012.15 2.92l-1.06 3.178m-13.5 0h13.5M6 18.25h12M6 11.25h12" />
  </svg>
);

export default PrintIcon;