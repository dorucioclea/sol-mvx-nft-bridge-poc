import React from "react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuGroup, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger } from "../../ui/dropdown-menu";
import { Boxes } from "lucide-react";
import { Button } from "../../ui/button";
import { useNavigate } from "react-router-dom";

type DropdownComponentProps = {
  walletAddress: string;
  triggerButton: React.ReactNode;
  disconnectWallet?: () => void;
  pathToRedirect: string;
};

export const DropdownComponent: React.FC<DropdownComponentProps> = (props) => {
  const { walletAddress, triggerButton, disconnectWallet, pathToRedirect } = props;
  const navigate = useNavigate();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>{triggerButton}</DropdownMenuTrigger>
      <DropdownMenuContent className="w-56">
        <DropdownMenuLabel>
          {walletAddress.substring(0, 4)}...{walletAddress.substring(walletAddress.length, walletAddress.length - 4)}
        </DropdownMenuLabel>
        <DropdownMenuGroup>
          <DropdownMenuItem onClick={() => navigate(pathToRedirect)}>
            <Boxes className="mr-2 h-4 w-4" />
            <span>Inventory</span>
          </DropdownMenuItem>
        </DropdownMenuGroup>
        <DropdownMenuGroup>
          <Button className="text-rose-600 cursor-pointer" onClick={disconnectWallet} variant="ghost">
            Disconnect
          </Button>
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
