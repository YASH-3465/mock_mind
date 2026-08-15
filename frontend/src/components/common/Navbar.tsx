import { Link } from "react-router-dom";

const Navbar = () => {
  return (
    <nav
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        padding: "16px 24px",
        borderBottom: "1px solid #333",
      }}
    >
      <h2>Mock Mind</h2>

      <div
        style={{
          display: "flex",
          gap: "20px",
        }}
      >
        <Link to="/">Home</Link>

        <Link to="/login">Login</Link>

        <Link to="/signup">Signup</Link>
      </div>
    </nav>
  );
};

export default Navbar;