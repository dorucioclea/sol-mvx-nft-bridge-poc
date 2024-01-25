import "./App.css";
import { Header } from "./components/Layout/Header";
import { Content } from "./components/Layout/Content";
import { Footer } from "./components/Layout/Footer";
import { Home } from "./pages/Home/Home";
import { Route, Routes } from "react-router-dom";
import { UnlockMvx } from "./pages/MultiversXUnlockPage/UnlockMvx";
import { UnlockSol } from "./pages/SolanaUnlockPage/UnlockSol";
import { BlockchainWrapper } from "./components/Wrapper/BlockchainWrapper";
import { SolNfts } from "./pages/SolNfts/SolNfts";
import { MultiversXNfts } from "./pages/MultiversXNfts/MultiversXNfts";

function App() {
  return (
    <>
      <div className="">
        <div className="backgroundCircle"></div>
        <div className="backgroundCircle1"></div>
        <div className="flex flex-col min-h-[100svh] text-white backdrop-blur-xl">
          <Header />
          <BlockchainWrapper>
            <Content>
              <Routes>
                <Route path="/" element={<Home />}></Route>
                <Route path="/mvxLogin" element={<UnlockMvx />}></Route>
                <Route path="/solLogin" element={<UnlockSol />}></Route>
                <Route path="/solanaNfts" element={<SolNfts />}></Route>
                <Route path="/mvxNfts" element={<MultiversXNfts />}></Route>
              </Routes>
            </Content>
          </BlockchainWrapper>
          <Footer />
        </div>
      </div>
    </>
  );
}

export default App;
