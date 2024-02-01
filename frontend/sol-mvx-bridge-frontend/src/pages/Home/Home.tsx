import React from "react";

export const Home: React.FC = () => {
  return (
    <div className="flex flex-col justify-center items-center w-full tracking-wide ">
      <span className="text-4xl leading-relaxed font-medium">
        Welcome to Itheum <span className="font-bold text-teal-500">Data NFT's Bridge</span>
      </span>
      <span className="text-2xl">Please select your blockchain</span>
    </div>
  );
};
