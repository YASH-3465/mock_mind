import { Outlet } from "react-router-dom";

import Navbar from "../components/common/Navbar";
import Footer from "../components/common/Footer";

const MainLayout = () => {
  return (
    <>
      <Navbar />

      <main
        style={{
          minHeight: "80vh",
          padding: "30px",
        }}
      >
        <Outlet />
      </main>

      <Footer />
    </>
  );
};

export default MainLayout;