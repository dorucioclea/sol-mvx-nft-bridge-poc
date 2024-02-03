import React, { useEffect } from "react";
import { Link, NavLink } from "react-router-dom";
import { Button } from "../../ui/button";
import { useGetAccount, useGetIsLoggedIn } from "@multiversx/sdk-dapp/hooks";
import { formatAmount, logout } from "@multiversx/sdk-dapp/utils";
import mvxAvatar from "../../assets/mvxAvatar.png";
import solAvatar from "../../assets/solAvatar.png";
import { Avatar, AvatarFallback, AvatarImage } from "../../ui/avatar";
import { useUserStore } from "../../store/user";
import { DropdownComponent } from "../DropdownMenu/DropdownComponent";
import { LAMPORTS_PER_SOL } from "@solana/web3.js";
import { clearMvxSessionStorage, clearSolSessionStorage, getProvider } from "../../../lib/utils";
import mvxLogo from "../../assets/mvxLogo.png";
import solLogo from "../../assets/solLogo.png";
import BigNumber from "bignumber.js";

export const Header: React.FC = () => {
  const isMxLoggedIn = useGetIsLoggedIn();
  const { address, balance } = useGetAccount();
  const { updateIsSolanaLoggedIn, updatePublicKey } = useUserStore((state) => state);
  const isSolLoggedIn = useUserStore((state) => state.isSolanaLoggedIn);
  const solanaBalance = useUserStore((state) => state.solanaBalance);
  const storePublicKey = useUserStore((state) => state.publicKey);
  const provider = getProvider();

  console.log(provider);

  const mvxLogout = logout;

  const disconnect = async () => {
    if (!provider) return;
    try {
      const resp = await provider.disconnect();
      // console.log(resp.publicKey.toString());
    } catch (err) {
      console.log("User rejected the request.", err);
    }
  };

  useEffect(() => {
    provider.on("disconnect", () => {
      updateIsSolanaLoggedIn(false);
      updatePublicKey("");
      localStorage.setItem("solanaPublicKey", "");
    });
  }, [provider, isSolLoggedIn]);

  const handleMvxLogout = () => {
    clearMvxSessionStorage();
    mvxLogout("/mvx", undefined, false);
  };

  const handleSolLogout = async () => {
    clearSolSessionStorage();
    await disconnect();
  };

  return (
    <nav className="text-xl bg-zinc-900">
      <div className="flex flex-row justify-between px-12 items-center h-14 ">
        <div className="flex justify-center items-center gap-10">
          <Link to={"/"} className="flex flex-row">
            <p className="bg-gradient-to-r bg-clip-text text-transparent from-violet-500 to-teal-400 text-xl text-left font-semibold font-epilogue">
              Bridge-POC
            </p>
          </Link>
          <Link to={"bridge"} className="text-lg font-medium hover:scale-105 hover:-translate-y-0.5 hover:transition hover:duration-300">
            Bridge
          </Link>
        </div>
        <div className="flex gap-3">
          {isMxLoggedIn ? (
            <DropdownComponent
              triggerButton={
                <Button className="bg-transparent font-semibold" variant="ghost">
                  {BigNumber(balance)
                    .div(10 ** 18)
                    .toFixed(3)}
                  EGLD
                  <Avatar className="w-8 h-8 ml-2">
                    <AvatarImage src={mvxAvatar} alt="mvxAvatar" />
                    <AvatarFallback>MVX</AvatarFallback>
                  </Avatar>
                </Button>
              }
              pathToRedirect={"mvx/mvxInventory"}
              walletAddress={address}
              disconnectWallet={handleMvxLogout}
            />
          ) : (
            <Link to={"mvx/mvxLogin"}>
              <Button className="font-semibold">Connect MVX</Button>
            </Link>
          )}

          {isSolLoggedIn ? (
            <DropdownComponent
              walletAddress={storePublicKey}
              triggerButton={
                <Button className="bg-transparent font-semibold" variant="ghost">
                  {Number(solanaBalance / LAMPORTS_PER_SOL).toFixed(3)} SOL
                  <Avatar className="w-8 h-8 ml-2">
                    <AvatarImage src={solAvatar} alt="solAvatar" />
                    <AvatarFallback>SOL</AvatarFallback>
                  </Avatar>
                </Button>
              }
              pathToRedirect={"sol/solInventory"}
              disconnectWallet={handleSolLogout}
            />
          ) : (
            <Link to={"sol/solLogin"}>
              <Button className="font-semibold">
                <p className="">Connect SOL</p>
              </Button>
            </Link>
          )}
        </div>
      </div>
      <div className="flex flex-row gap-x-5 justify-left px-12 items-center h-10 border-b border-b-gray-400 font-medium">
        <NavLink
          to={"mvx"}
          end
          className={({ isActive }) =>
            isActive ? "flex items-center justify-center bg-slate-700/40 pl-2" : "flex items-center justify-center bg-transparent pl-2"
          }>
          <img src={mvxLogo} alt="mvxLogo" className="w-4 h-4" />
          <p className="flex justify-center items-center px-3 h-10">MultiversX</p>
        </NavLink>

        <NavLink
          to={"sol"}
          end
          className={({ isActive }) =>
            isActive ? "flex items-center justify-center bg-slate-700/40 pl-2" : "flex items-center justify-center bg-transparent pl-2"
          }>
          <img src={solLogo} alt="solLogo" className="w-4 h-4" />
          <p className="flex justify-center items-center px-3 h-10">Solana</p>
        </NavLink>
      </div>
    </nav>
  );
};
