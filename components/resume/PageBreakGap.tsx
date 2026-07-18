import React, { memo } from "react";

export interface PageBreakGapProps {
  id: string;
  pageBreakElementIds: string[];
  gapHeights?: Record<string, { total: number; top: number }>;
  pageMargin: number;
  pageMarginX?: number;
  pageMarginY?: number;
}

export const PageBreakGap = memo(({ id, pageBreakElementIds, gapHeights, pageMargin, pageMarginX, pageMarginY }: PageBreakGapProps) => {
  const isBreak = pageBreakElementIds.includes(id);
  if (!isBreak) return null;

  const mX = pageMarginX ?? pageMargin;
  const mY = pageMarginY ?? pageMargin;

  const pageIndex = pageBreakElementIds.indexOf(id) + 2;
  const gapInfo = gapHeights?.[id];
  const totalHeight = gapInfo ? gapInfo.total : (2 * mY + 32);
  const topSpacer = gapInfo ? gapInfo.top : mY;
  const bottomSpacer = mY;

  return (
    <div
      className="page-break-gap no-print relative w-[calc(100%+2*var(--page-margin-x))] flex flex-col items-center justify-center pointer-events-none select-none z-10"
      style={{
        height: `${totalHeight}px`,
        marginLeft: "calc(-1 * var(--page-margin-x))",
        marginRight: "calc(-1 * var(--page-margin-x))",
      }}
    >
      {/* Top Margin Spacer */}
      <div style={{ height: `${topSpacer}px` }} />
      
      {/* 32px Physical Page Gap with Page Label */}
      <div className="h-[32px] w-full flex items-center justify-center relative">
        <div className="absolute left-0 right-0 h-[1px] bg-gray-300/40" />
        <span className="relative z-10 bg-gray-500/85 text-white font-sans text-[11px] font-bold px-2.5 py-0.5 rounded shadow-sm tracking-wide backdrop-blur-xs">
          Page {pageIndex}
        </span>
      </div>

      {/* Bottom Margin Spacer */}
      <div style={{ height: `${bottomSpacer}px` }} />
    </div>
  );
});
