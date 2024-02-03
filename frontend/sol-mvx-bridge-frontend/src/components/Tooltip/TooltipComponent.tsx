import React, { ReactNode } from "react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "../../ui/tooltip";

type TooltipComponentProps = {
  tooltipTrigger: ReactNode;
  tooltipContent: string;
};

export const TooltipComponent: React.FC<TooltipComponentProps> = (props) => {
  const { tooltipTrigger, tooltipContent } = props;

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>{tooltipTrigger}</TooltipTrigger>
        <TooltipContent>
          <p>{tooltipContent}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};
