import React from 'react';

interface BarcodeRendererProps {
  value: string;
  width?: number;
  height?: number;
  showText?: boolean;
  className?: string;
}

export const BarcodeRenderer: React.FC<BarcodeRendererProps> = ({
  value,
  width = 180,
  height = 48,
  showText = true,
  className = '',
}) => {
  // Generate pseudo-deterministic Code128-like bar pattern from the string
  const bars: number[] = [];
  let checksum = 0;
  for (let i = 0; i < value.length; i++) {
    const code = value.charCodeAt(i);
    checksum += code;
    // Each character generates a sequence of bar widths (1, 2, 3)
    bars.push((code % 3) + 1);
    bars.push(((code * 3) % 2) + 1);
    bars.push(((code * 7) % 3) + 1);
    bars.push(((code * 2) % 2) + 1);
  }

  // Guard rails on the ends
  const fullPattern = [2, 1, 1, ...bars, 2, 1, 2];
  const totalUnits = fullPattern.reduce((acc, curr) => acc + curr, 0);
  const unitWidth = width / totalUnits;

  let currentX = 0;
  const rects: { x: number; w: number }[] = [];

  fullPattern.forEach((barWidth, index) => {
    const w = barWidth * unitWidth;
    if (index % 2 === 0) {
      rects.push({ x: currentX, w: Math.max(1, w - 0.3) });
    }
    currentX += w;
  });

  return (
    <div className={`inline-flex flex-col items-center bg-white p-2 rounded border border-slate-200 shadow-xs ${className}`}>
      <svg
        width={width}
        height={height}
        viewBox={`0 0 ${width} ${height}`}
        className="overflow-hidden"
      >
        {rects.map((r, i) => (
          <rect
            key={i}
            x={r.x}
            y={0}
            width={r.w}
            height={height}
            fill="#0f172a"
          />
        ))}
      </svg>
      {showText && (
        <span className="font-mono text-xs font-semibold text-slate-700 tracking-wider mt-1 select-all">
          {value}
        </span>
      )}
    </div>
  );
};
