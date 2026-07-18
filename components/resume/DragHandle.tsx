import React, { memo } from "react";
import { GripVertical } from "lucide-react";

export const DragHandle = memo(({ dragControls }: { dragControls: any }) => (
  <span
    className="drag-handle inline-flex items-center justify-center w-5 h-5 rounded-md cursor-grab text-[var(--ink-soft)] text-sm bg-black/5 hover:bg-black/10 hover:text-[var(--ink)] active:cursor-grabbing font-sans shrink-0 select-none no-print"
    onPointerDown={(e) => dragControls.start(e)}
    title="Drag to reorder"
  >
    <GripVertical size={14} />
  </span>
));
