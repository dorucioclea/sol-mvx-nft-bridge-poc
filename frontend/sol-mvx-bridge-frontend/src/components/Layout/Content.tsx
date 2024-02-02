import React, { JSX } from "react";

type ContentProps = {
  children: JSX.Element;
};
export const Content: React.FC<ContentProps> = ({ children }) => {
  return <div className="flex flex-col justify-center items-center w-11/12 flex-grow mx-auto py-10">{children}</div>;
};
