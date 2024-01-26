import React from "react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuGroup, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger } from "../../ui/dropdown-menu";
import { Boxes } from "lucide-react";
import { Button } from "../../ui/button";

type DropdownComponentProps = {
  walletAddress: string;
  triggerButton: React.ReactNode;
  disconnectWallet?: () => void;
};

export const DropdownComponent: React.FC<DropdownComponentProps> = (props) => {
  const { walletAddress, triggerButton, disconnectWallet } = props;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>{triggerButton}</DropdownMenuTrigger>
      <DropdownMenuContent className="w-56">
        <DropdownMenuLabel>
          {walletAddress.substring(0, 4)}...{walletAddress.substring(walletAddress.length, walletAddress.length - 4)}
        </DropdownMenuLabel>
        <DropdownMenuGroup>
          <DropdownMenuItem>
            <Boxes className="mr-2 h-4 w-4" />
            <span>Inventory</span>
          </DropdownMenuItem>
        </DropdownMenuGroup>
        <DropdownMenuGroup>
          <DropdownMenuItem>
            <Button className="text-rose-600 cursor-pointer" onClick={disconnectWallet} variant="ghost">
              Disconnect
            </Button>
          </DropdownMenuItem>
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
