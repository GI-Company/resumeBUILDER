import React, { memo } from "react";
import { Reorder, useDragControls } from "motion/react";

export const SubItemWrapper = memo(({ id, item, value, className, children }: any) => {
  const dc = useDragControls();
  const actualValue = item ?? value;
  return (
    <Reorder.Item
      key={id}
      value={actualValue}
      id={id}
      dragListener={false}
      dragControls={dc}
      className={className}
    >
      {typeof children === "function" ? children(dc) : children}
    </Reorder.Item>
  );
});
