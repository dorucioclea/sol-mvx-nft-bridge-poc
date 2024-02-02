import React, { useEffect } from "react";
import landing from "../../assets/landing.png";
import dataNft from "../../assets/dataNft.png";
import { motion, useAnimation } from "framer-motion";
import { Button } from "../../ui/button";
import { useNavigate } from "react-router-dom";

export const Home: React.FC = () => {
  const controls = useAnimation();
  const navigate = useNavigate();
  const move = () => {
    controls.start({
      x: [5, 530],
      y: [10, -35, 0],
      transition: { stiffness: 50, ease: "easeInOut", duration: 10, repeat: Infinity, repeatType: "reverse" },
    });
  };
  useEffect(() => {
    move();
  }, []);
  return (
    <div className="flex justify-center items-center w-full tracking-wide ">
      <div className="absolute z-50 pb-[32rem]">
        <div className="flex flex-col justify-center items-center gap-4">
          <div className="flex bg-gradient-to-r from-[#00E4C850] via-[#1768E250] to-[#E07EDD50] rounded-full p-0.5">
            <span className="bg-black/30 rounded-full px-4 py-1.5">Bridge your Data NFTs between Solana and MultiversX</span>
          </div>
          <span className="text-[6rem]">The Data NFT Portal Opens</span>
          <span className="text-xl text-muted-foreground font-thin text-center">
            Data NFTs are valuable real-world data assets wrapped into NFT tokens.
            <br />
            Hold the Data NFT to access the data inside.
          </span>
          <div className="flex justify-center items-center gap-7 pt-2">
            <Button className="bg-foreground text-background rounded-full" size="lg" onClick={() => navigate("/bridge")}>
              Bridge Data NFT
            </Button>
            <Button variant="outline" size="lg" className="border-primary rounded-full">
              View Docs
            </Button>
          </div>
        </div>
      </div>
      <div className="relative w-[100%] z-0">
        <motion.div className="absolute top-[60%] left-[35%] z-30" animate={controls}>
          <motion.img src={dataNft} alt="dataNft" />
        </motion.div>
        <img src={landing} alt="solCircle" className="sticky w-full bg-cover bg-center h-[93svh]" />
      </div>
    </div>
  );
};
