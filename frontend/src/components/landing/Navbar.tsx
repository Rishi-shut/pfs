import { Link } from "react-router-dom";
import { Button } from "../ui/button";

const links = [
  { label: "Home", to: "/" },
  { label: "How it works", to: "#how" },
  { label: "The agent", to: "#agent" },
  { label: "Try it", to: "/try" },
];

export default function Navbar() {
  return (
    <header className="relative z-20 flex items-center justify-between px-6 md:px-12 lg:px-20 py-5 font-body">
      <Link to="/" className="text-xl font-semibold tracking-tight text-foreground">
        ✦ Fiserv Agent
      </Link>

      <nav className="hidden md:flex items-center gap-8">
        {links.map((l) => (
          <Link
            key={l.label}
            to={l.to}
            className="text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            {l.label}
          </Link>
        ))}
      </nav>

      <Link to="/try">
        <Button className="rounded-full px-5 text-sm font-medium">Try it →</Button>
      </Link>
    </header>
  );
}
