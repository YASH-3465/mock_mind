import { Link } from "react-router-dom";
import { motion } from "framer-motion";

const Navbar = () => {
  return (
    <motion.header
      initial={{ y: -60, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.6 }}
      className="sticky top-0 z-50"
    >
      <nav className="mx-auto mt-5 flex w-[92%] max-w-7xl items-center justify-between rounded-2xl border border-white/10 bg-white/5 px-6 py-4 backdrop-blur-xl">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-r from-blue-500 to-violet-500 font-bold">
            M
          </div>

          <span className="text-xl font-bold tracking-wide">
            Mock Mind
          </span>
        </Link>

        {/* Navigation */}
        <div className="hidden items-center gap-8 md:flex">
          <a href="#features" className="text-slate-300 hover:text-white transition">
            Features
          </a>

          <a href="#how-it-works" className="text-slate-300 hover:text-white transition">
            How it Works
          </a>

          <a href="#about" className="text-slate-300 hover:text-white transition">
            About
          </a>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-4">
          <Link
            to="/login"
            className="hidden text-slate-300 transition hover:text-white md:block"
          >
            Login
          </Link>

          <Link
            to="/signup"
            className="rounded-xl bg-gradient-to-r from-blue-500 to-violet-500 px-5 py-2.5 font-medium transition hover:scale-105"
          >
            Get Started
          </Link>
        </div>
      </nav>
    </motion.header>
  );
};

export default Navbar;