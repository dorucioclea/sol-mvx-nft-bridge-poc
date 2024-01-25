import React from "react";
import { Link, NavLink } from "react-router-dom";
import { Button } from "../../ui/button";
import { useGetAccount, useGetIsLoggedIn } from "@multiversx/sdk-dapp/hooks";
import { formatAmount } from "@multiversx/sdk-dapp/utils";
import mvxAvatar from "../../assets/mvxAvatar.png";
import { Avatar, AvatarFallback, AvatarImage } from "../../ui/avatar";
import { useUserStore } from "../../store/user";

export const Header: React.FC = () => {
  const isMxLoggedIn = useGetIsLoggedIn();
  const { address, balance } = useGetAccount();
  const isSolLoggedIn = useUserStore((state) => state.isSolanaLoggedIn);

  return (
    <nav className="text-white text-xl bg-gray-600/10">
      <div className="flex flex-row justify-between px-12 items-center h-14 ">
        <div className="flex justify-center items-center gap-10">
          <Link to={"/"} className="flex flex-row">
            <p className="bg-gradient-to-r bg-clip-text text-transparent from-violet-500 to-teal-400 text-lg text-left font-bold">Bridge-POC</p>
          </Link>
          <Link to={"/bridge"} className="text-sm font-semibold hover:scale-105 hover:-translate-y-0.5 hover:transition hover:duration-300">
            Bridge
          </Link>
        </div>
        <div className="flex gap-3">
          <Link to={"/mvxLogin"}>
            {isMxLoggedIn ? (
              <Button className="text-background bg-transparent font-semibold" variant="ghost">
                {Number(formatAmount({ input: balance })).toFixed(4)} EGLD
                <Avatar className="w-8 h-8 ml-2">
                  <AvatarImage src={mvxAvatar} alt="mvxAvatar" />
                  <AvatarFallback>MVX</AvatarFallback>
                </Avatar>
              </Button>
            ) : (
              <Button className="text-background bg-transparent font-semibold" variant="outline">
                Connect MVX
              </Button>
            )}
          </Link>

          <Link to={"/solLogin"}>
            {isSolLoggedIn ? (
              <Button className="text-background bg-transparent font-semibold" variant="ghost">
                <p className="">Connect SOL</p>
              </Button>
            ) : (
              <Button className="text-background bg-transparent font-semibold" variant="outline">
                <p className="">Connect SOL</p>
              </Button>
            )}
          </Link>
        </div>
      </div>
      <div className="flex flex-row gap-x-5 justify-left px-9 items-center h-10 border-b border-b-gray-400 font-bold">
        <NavLink to={"/mvxLogin"} className={({ isActive }) => (isActive ? "bg-slate-700/40" : "bg-transparent")}>
          <p className="flex justify-center items-center text-teal-400 px-3 h-10">MultiversX</p>
        </NavLink>

        <NavLink to={"/solLogin"} className={({ isActive }) => (isActive ? "bg-slate-700/40" : "bg-transparent")}>
          <p className="flex justify-center items-center bg-gradient-to-r from-violet-500 to-[#5984cd] bg-clip-text text-transparent px-3 h-10">Solana</p>
        </NavLink>
      </div>
    </nav>
  );
};
