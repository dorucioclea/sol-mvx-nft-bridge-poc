import React, { ReactNode } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "../../ui/dialog";

type ModalComponentProps = {
  children: ReactNode;
  buttonTrigger: ReactNode;
};
export const ModalComponent: React.FC<ModalComponentProps> = (props) => {
  const { children, buttonTrigger } = props;
  return (
    <Dialog>
      <DialogTrigger asChild>{buttonTrigger}</DialogTrigger>
      <DialogContent className="sm:max-w-[70svh] h-[55svh]">
        <DialogHeader>
          <DialogTitle>View the data from NFT</DialogTitle>
          <DialogDescription>Here you can check what's inside your Data NFT</DialogDescription>
        </DialogHeader>
        <div className="flex gap-4 py-4">{children}</div>
      </DialogContent>
    </Dialog>
  );
};
