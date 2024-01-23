import React from "react";
import { Link, NavLink } from "react-router-dom";

export const Header: React.FC = () => {
  return (
    <nav className="text-white text-xl">
      <div className="flex flex-row justify-left px-12 items-center h-12 ">
        <Link to={"/"} className="flex flex-row">
          <p className="text-lg text-left font-bold">Bridge-POC</p>
        </Link>
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
