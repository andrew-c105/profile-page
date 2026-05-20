import { Link } from "react-router-dom";

const Navbar = () => {
  return (
    <nav className="fixed top-0 left-0 w-full bg-white border-b border-gray-200 z-50">
      <div className="max-w-5xl mx-auto px-6 h-16 flex items-center justify-between">
        <div className="flex items-center gap-6">
          <Link to="/" className="text-lg text-gray-600 hover:text-gray-900">
            Homepage
          </Link>
          <Link
            to="/games"
            className="text-lg text-gray-600 hover:text-gray-900"
          >
            Games
          </Link>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
