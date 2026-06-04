import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import Navbar from "../components/landing/Navbar";
import Hero from "../components/landing/Hero";
import HowItWorks from "../components/landing/HowItWorks";
import TheAgent from "../components/landing/TheAgent";

export default function Landing() {
  const location = useLocation();

  useEffect(() => {
    if (location.state && (location.state as any).scrollTo) {
      const targetId = (location.state as any).scrollTo;
      const el = document.getElementById(targetId);
      if (el) {
        setTimeout(() => {
          el.scrollIntoView({ behavior: "smooth" });
        }, 100);
      }
      // Clear state to prevent scrolling again on reload
      window.history.replaceState({}, document.title);
    }
  }, [location]);

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      <Hero />
      <HowItWorks />
      <TheAgent />
    </div>
  );
}
