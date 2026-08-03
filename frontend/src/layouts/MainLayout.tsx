import { Outlet } from "react-router-dom";

const MainLayout = () => {
  return (
    <>
      <header
        style={{
          padding: "16px",
          borderBottom: "1px solid #333",
        }}
      >
        <h2>Mock Mind</h2>
      </header>

      <main
        style={{
          minHeight: "80vh",
          padding: "30px",
        }}
      >
        <Outlet />
      </main>

      <footer
        style={{
          padding: "16px",
          borderTop: "1px solid #333",
          textAlign: "center",
        }}
      >
        © Mock Mind
      </footer>
    </>
  );
};

export default MainLayout;