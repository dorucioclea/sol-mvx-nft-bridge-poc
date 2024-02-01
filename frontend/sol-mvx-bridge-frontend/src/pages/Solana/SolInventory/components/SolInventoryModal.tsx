import React, { JSX, ReactNode } from "react";
import { ModalComponent } from "../../../../components/Modal/ModalComponent";

type SolInventoryModalProps = {
  modalContent: string;
  buttonTrigger: ReactNode;
};
export const SolInventoryModal: React.FC<SolInventoryModalProps> = (props) => {
  const { modalContent, buttonTrigger } = props;
  return (
    <ModalComponent buttonTrigger={buttonTrigger}>
      <iframe src={modalContent} className="w-full h-[45svh]" />
    </ModalComponent>
  );
};
