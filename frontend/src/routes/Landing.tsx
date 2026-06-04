import Navbar from "../components/landing/Navbar";
import Hero from "../components/landing/Hero";
import HowItWorks from "../components/landing/HowItWorks";
import TheAgent from "../components/landing/TheAgent";

export default function Landing() {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      <Hero />
      <HowItWorks />
      <TheAgent />
    </div>
  );
}
