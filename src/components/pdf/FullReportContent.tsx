'use client';

import { forwardRef } from 'react';
import { reportSlides } from '@/lib/slide-config';

const FullReportContent = forwardRef<HTMLDivElement>(function FullReportContent(_, ref) {
  return (
    <div ref={ref} className="bg-white text-gray-900" style={{ width: 1200 }}>
      {reportSlides.map(({ id, Component }) => (
        <div key={id} data-section={id} className="p-6">
          <Component />
        </div>
      ))}
    </div>
  );
});

export default FullReportContent;
