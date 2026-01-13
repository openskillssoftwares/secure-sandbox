import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { Terminal, ArrowRight, Shield, Lock, Zap } from "lucide-react";
import heroBg from "@/assets/hero-bg.jpg";

const HeroSection = () => {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Background Image */}
      <div 
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: `url(${heroBg})` }}
      >
        <div className="absolute inset-0 bg-gradient-to-b from-background/90 via-background/70 to-background" />
      </div>

      {/* Grid Overlay */}
      <div className="absolute inset-0 cyber-grid opacity-30" />

      {/* Glow Effects */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl animate-pulse" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-green-500/10 rounded-full blur-3xl animate-pulse delay-1000" />

      {/* Content */}
      <div className="relative z-10 container mx-auto px-4 text-center pt-20">
        {/* Badge */}
        <div className="inline-flex items-center gap-2 bg-cyan-500/10 border border-cyan-500/30 rounded-full px-4 py-2 mb-8 animate-fade-in">
          <Terminal className="h-4 w-4 text-cyan-400" />
          <span className="text-cyan-400 text-sm font-medium">Practice Real-World Hacking Skills</span>
        </div>

        {/* Main Heading */}
        <h1 className="text-4xl md:text-6xl lg:text-7xl font-black mb-6 animate-fade-in-up" style={{ animationDelay: "0.1s" }}>
          <span className="text-foreground">Master </span>
          <span className="bg-gradient-to-r from-cyan-400 via-cyan-300 to-green-400 bg-clip-text text-transparent">
            Ethical Hacking
          </span>
          <br />
          <span className="text-foreground">in a </span>
          <span className="bg-gradient-to-r from-green-400 to-cyan-400 bg-clip-text text-transparent">
            Safe Sandbox
          </span>
        </h1>

        {/* Description */}
        <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-10 animate-fade-in-up" style={{ animationDelay: "0.2s" }}>
          Learn penetration testing through hands-on labs. Practice SQL injection, XSS, SSRF, 
          and more in isolated environments designed for ethical hackers.
        </p>

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16 animate-fade-in-up" style={{ animationDelay: "0.3s" }}>
          <Link to="/signup">
            <Button variant="cyber" size="xl" className="w-full sm:w-auto group">
              Start Free Trial
              <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
            </Button>
          </Link>
          <Link to="/labs">
            <Button variant="cyber-outline" size="xl" className="w-full sm:w-auto">
              Explore Labs
            </Button>
          </Link>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 max-w-3xl mx-auto animate-fade-in-up" style={{ animationDelay: "0.4s" }}>
          {[
            { icon: Shield, value: "50+", label: "Practice Labs" },
            { icon: Lock, value: "10K+", label: "Hackers" },
            { icon: Terminal, value: "100+", label: "Challenges" },
            { icon: Zap, value: "99.9%", label: "Uptime" },
          ].map((stat, index) => (
            <div key={index} className="text-center">
              <stat.icon className="h-6 w-6 text-cyan-400 mx-auto mb-2" />
              <div className="text-2xl md:text-3xl font-bold text-foreground">{stat.value}</div>
              <div className="text-sm text-muted-foreground">{stat.label}</div>
            </div>
          ))}
        </div>

        {/* Terminal Preview */}
        <div className="mt-16 max-w-3xl mx-auto animate-fade-in-up" style={{ animationDelay: "0.5s" }}>
          <div className="card-cyber rounded-xl overflow-hidden">
            <div className="flex items-center gap-2 px-4 py-3 border-b border-border/50">
              <div className="w-3 h-3 rounded-full bg-red-500" />
              <div className="w-3 h-3 rounded-full bg-yellow-500" />
              <div className="w-3 h-3 rounded-full bg-green-500" />
              <span className="ml-4 text-muted-foreground text-sm font-mono">terminal@cyberlabs</span>
            </div>
            <div className="p-6 text-left font-mono text-sm">
              <p className="text-green-400">$ <span className="text-foreground">connect --lab sql-injection-1</span></p>
              <p className="text-muted-foreground mt-2">[*] Connecting to isolated sandbox...</p>
              <p className="text-cyan-400 mt-1">[+] Connection established!</p>
              <p className="text-muted-foreground mt-1">[*] Target: vulnerable-app.lab</p>
              <p className="text-green-400 mt-2">$ <span className="text-foreground typing-effect inline-block">sqlmap -u "http://labs.pentest-me/sql-injection/search?q=test"</span></p>
              <p className="text-cyan-400 mt-1 typing-effect-delayed">[+] <span className="text-foreground">Vulnerability Identified</span></p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
