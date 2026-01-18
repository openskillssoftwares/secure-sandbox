import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Shield, Menu, X, TextCursor, User } from "lucide-react";
import DecryptedText from "./DecryptedText";
import NotificationBell from "./NotificationBell";
import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const { user, signOut } = useAuth();

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-xl border-b border-border/50">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 group">
            <div className="relative">
              <TextCursor className="h-4 w-4 text-cyan-400 transition-all duration-300 group-hover:text-cyan-300" />
              <div className="absolute inset-0 blur-lg bg-cyan-500/30 opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
            <span className="text-xl font-bold bg-gradient-to-r from-cyan-400 to-green-400 bg-clip-text text-transparent typing-effect first-letter: inline-block">
              _PenTest Me!
            </span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-12">
            <Link to="/" className="text-muted-foreground hover:text-cyan-400 transition-colors font-medium">
              Home
            </Link>
            <Link to="/labs" className="text-muted-foreground hover:text-cyan-400 transition-colors font-medium">
              Labs
            </Link>
            <Link to="/pricing" className="text-muted-foreground hover:text-cyan-400 transition-colors font-medium">
              Pricing
            </Link>
            <Link to="/roadmap" className="text-muted-foreground hover:text-cyan-400 transition-colors font-medium">
              Roadmap
            </Link>
            <Link to="/blog" className="text-muted-foreground hover:text-cyan-400 transition-colors font-medium">
              Blog
            </Link>
            <Link to="/about" className="text-muted-foreground hover:text-cyan-400 transition-colors font-medium">
            About
            </Link>
          </div>

          {/* Desktop Auth Buttons */}
          <div className="hidden md:flex items-center gap-6">
            {user ? (
              <>
                <NotificationBell />
                <Link to="/dashboard">
                  <Button variant="cyber-ghost" size="lg">
                    <User className="h-4 w-4 mr-2" />
                    Dashboard
                  </Button>
                </Link>
                <Button variant="cyber-outline" size="lg" onClick={() => signOut()}>
                  Log Out
                </Button>
              </>
            ) : (
              <>
                <Link to="/login">
                  <Button variant="cyber-ghost" size="lg">
                    Log In
                  </Button>
                </Link>
                <Link to="/signup">
                  <Button variant="cyber" size="lg">
                    Start Hacking
                  </Button>
                </Link>
              </>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden text-foreground"
            onClick={() => setIsOpen(!isOpen)}
          >
            {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>

        {/* Mobile Menu */}
        {isOpen && (
          <div className="md:hidden py-4 border-t border-border/50 animate-fade-in">
            <div className="flex flex-col gap-4">
              <Link to="/labs" className="text-muted-foreground hover:text-cyan-400 transition-colors font-medium py-2">
                Labs
              </Link>
              <Link to="/pricing" className="text-muted-foreground hover:text-cyan-400 transition-colors font-medium py-2">
                Pricing
              </Link>
              <Link to="/roadmap" className="text-muted-foreground hover:text-cyan-400 transition-colors font-medium py-2">
                Roadmap
              </Link>
              <Link to="/blog" className="text-muted-foreground hover:text-cyan-400 transition-colors font-medium py-2">
                Blog
              </Link>
              <div className="flex gap-4 pt-4 border-t border-border/50">
                {user ? (
                  <>
                    <Link to="/dashboard" className="flex-1">
                      <Button variant="cyber-outline" className="w-full">
                        Dashboard
                      </Button>
                    </Link>
                    <Button variant="cyber" className="flex-1" onClick={() => signOut()}>
                      Log Out
                    </Button>
                  </>
                ) : (
                  <>
                    <Link to="/login" className="flex-1">
                      <Button variant="cyber-outline" className="w-full">
                        Log In
                      </Button>
                    </Link>
                    <Link to="/signup" className="flex-1">
                      <Button variant="cyber" className="w-full">
                        Sign Up
                      </Button>
                    </Link>
                  </>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
