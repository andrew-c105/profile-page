import { BrowserRouter, Routes, Route } from "react-router-dom";
import Layout from "./components/Layout";
import LandingPage from "./pages/LandingPage";
import Games from "./pages/Games";
import Game2048 from "./pages/Game2048";
import ColourGuesser from "./pages/ColourGuesser";

function App() {
  return (
    <BrowserRouter>
      <Layout>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/games" element={<Games />} />
          <Route path="/games/2048" element={<Game2048 />} />
          <Route path="/games/colourguesser" element={<ColourGuesser />} />
        </Routes>
      </Layout>
    </BrowserRouter>
  );
}

export default App;

