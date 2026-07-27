import AnimatedBackground from "../../components/common/AnimatedBackground";
import Navbar from "../../components/landing/Navbar";
import Hero from "../../components/landing/Hero";
import Features from "../../components/landing/Features";
import HowItWorks from "../../components/landing/HowItWorks";
import CTA from "../../components/landing/CTA";
import Footer from "../../components/landing/Footer";

const LandingPage = () => {
  return (
    <>
      <AnimatedBackground />

      <div className="relative min-h-screen bg-[#050816] text-white overflow-hidden">
        <Navbar />
        <Hero />
        <Features />
        <HowItWorks />
        <CTA />
        <Footer />
      </div>
    </>
  );
};

export default LandingPage;