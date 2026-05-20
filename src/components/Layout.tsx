import Navbar from "./Navbar";
import { ReactNode } from "react";
import { useLocation } from "react-router-dom";

interface LayoutProps {
  children: ReactNode;
}

const Layout = ({ children }: LayoutProps) => {
  const location = useLocation();
  const isLanding = location.pathname === "/";

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      {!isLanding && <Navbar />}
      <main className={`flex-1 ${isLanding ? "" : "pt-16"}`}>
        {isLanding ? children : <div className="max-w-5xl mx-auto px-6 py-8">{children}</div>}
      </main>
    </div>
  );
};

export default Layout;
