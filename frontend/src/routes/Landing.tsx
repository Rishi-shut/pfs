import Navbar from "../components/landing/Navbar";
import Hero from "../components/landing/Hero";

export default function Landing() {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      <Hero />
    </div>
  );
}
