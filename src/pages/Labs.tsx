import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Database, Globe, Lock, Server, ShieldOff, Key, AlertTriangle, Bug, Network, Fingerprint, CreditCard, Eye, Search, Filter } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import sqlInjection from "@/assets/sql-injection.jpg";
import xssAttack from "@/assets/xss-attack.jpg";
import brokenAuth from "@/assets/broken-auth.jpg";

const allLabs = [
  {
    id: 1,
    icon: Database,
    title: "SQL Injection",
    description: "Master database exploitation techniques and learn to extract sensitive data through SQL injection vulnerabilities.",
    difficulty: "Easy",
    image: sqlInjection,
    challenges: 15,
    category: "Web",
    users: 5420,
  },
  {
    id: 2,
    icon: Database,
    title: "SQL Injection - Advanced",
    description: "Blind SQL injection, time-based attacks, and second-order injection techniques.",
    difficulty: "Hard",
    image: sqlInjection,
    challenges: 8,
    category: "Web",
    users: 2180,
  },
  {
    id: 3,
    icon: Globe,
    title: "XSS - Reflected",
    description: "Inject malicious scripts through reflected cross-site scripting vulnerabilities.",
    difficulty: "Easy",
    image: xssAttack,
    challenges: 10,
    category: "Web",
    users: 4890,
  },
  {
    id: 4,
    icon: Globe,
    title: "XSS - Stored & DOM",
    description: "Advanced XSS including stored and DOM-based cross-site scripting attacks.",
    difficulty: "Medium",
    image: xssAttack,
    challenges: 12,
    category: "Web",
    users: 3210,
  },
  {
    id: 5,
    icon: Lock,
    title: "Broken Authentication",
    description: "Exploit authentication flaws including weak passwords, session fixation, and credential stuffing.",
    difficulty: "Medium",
    image: brokenAuth,
    challenges: 10,
    category: "Authentication",
    users: 3890,
  },
  {
    id: 6,
    icon: ShieldOff,
    title: "Broken Access Control",
    description: "IDOR, privilege escalation, and bypassing authorization controls.",
    difficulty: "Medium",
    challenges: 8,
    category: "Authorization",
    users: 2940,
  },
  {
    id: 7,
    icon: Server,
    title: "SSRF Attacks",
    description: "Server-Side Request Forgery to access internal systems and cloud metadata.",
    difficulty: "Hard",
    challenges: 6,
    category: "Server",
    users: 1820,
  },
  {
    id: 8,
    icon: Key,
    title: "Cryptographic Failures",
    description: "Weak encryption, hardcoded secrets, and sensitive data exposure vulnerabilities.",
    difficulty: "Hard",
    challenges: 8,
    category: "Crypto",
    users: 1560,
  },
  {
    id: 9,
    icon: AlertTriangle,
    title: "Security Misconfiguration",
    description: "Default credentials, exposed debug pages, and misconfigured security headers.",
    difficulty: "Easy",
    challenges: 10,
    category: "Configuration",
    users: 4120,
  },
  {
    id: 10,
    icon: Bug,
    title: "Insecure Design",
    description: "Architectural flaws, missing security controls, and design weaknesses.",
    difficulty: "Medium",
    challenges: 7,
    category: "Design",
    users: 2340,
  },
  {
    id: 11,
    icon: Network,
    title: "Port Vulnerabilities",
    description: "Scanning, enumeration, and exploiting open ports and network services.",
    difficulty: "Medium",
    challenges: 9,
    category: "Network",
    users: 2780,
  },
  {
    id: 12,
    icon: Fingerprint,
    title: "Session Hijacking",
    description: "Stealing and manipulating user sessions through various attack vectors.",
    difficulty: "Hard",
    challenges: 6,
    category: "Session",
    users: 1920,
  },
  {
    id: 13,
    icon: CreditCard,
    title: "Banking System Vulnerabilities",
    description: "Real-world banking exploitation scenarios including payment bypass and transaction manipulation.",
    difficulty: "Impossible",
    challenges: 5,
    category: "Financial",
    users: 890,
  },
  {
    id: 14,
    icon: Eye,
    title: "Full System Compromise",
    description: "End-to-end penetration testing challenge. Gain root access to the target system.",
    difficulty: "Impossible",
    challenges: 4,
    category: "System",
    users: 720,
  },
];

const difficultyColors: Record<string, string> = {
  Easy: "badge-easy",
  Medium: "badge-medium",
  Hard: "badge-hard",
  Impossible: "badge-impossible",
};

const Labs = () => {
  const [search, setSearch] = useState("");
  const [selectedDifficulty, setSelectedDifficulty] = useState<string | null>(null);

  const filteredLabs = allLabs.filter((lab) => {
    const matchesSearch = lab.title.toLowerCase().includes(search.toLowerCase()) ||
                         lab.description.toLowerCase().includes(search.toLowerCase());
    const matchesDifficulty = !selectedDifficulty || lab.difficulty === selectedDifficulty;
    return matchesSearch && matchesDifficulty;
  });

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <main className="pt-24 pb-16">
        <div className="container mx-auto px-4">
          {/* Header */}
          <div className="text-center mb-12">
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              <span className="bg-gradient-to-r from-cyan-400 to-green-400 bg-clip-text text-transparent">
                Practice Labs
              </span>
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Choose your target and start hacking. Each lab runs in an isolated sandbox environment.
            </p>
          </div>

          {/* Filters */}
          <div className="flex flex-col md:flex-row gap-4 mb-8">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input
                placeholder="Search labs..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex gap-2 flex-wrap">
              <Button
                variant={selectedDifficulty === null ? "cyber" : "cyber-outline"}
                size="sm"
                onClick={() => setSelectedDifficulty(null)}
              >
                All
              </Button>
              {["Easy", "Medium", "Hard", "Impossible"].map((diff) => (
                <Button
                  key={diff}
                  variant={selectedDifficulty === diff ? "cyber" : "cyber-outline"}
                  size="sm"
                  onClick={() => setSelectedDifficulty(diff)}
                >
                  {diff}
                </Button>
              ))}
            </div>
          </div>

          {/* Labs Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredLabs.map((lab) => (
              <div
                key={lab.id}
                className="card-cyber overflow-hidden transition-all duration-300 hover:border-cyan-500/50 hover:-translate-y-1 group cursor-pointer"
              >
                {lab.image && (
                  <div className="relative h-40 overflow-hidden">
                    <img 
                      src={lab.image} 
                      alt={lab.title}
                      className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-card via-card/50 to-transparent" />
                  </div>
                )}
                
                <div className="p-6">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-lg bg-cyan-500/10 flex items-center justify-center">
                        <lab.icon className="h-5 w-5 text-cyan-400" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-foreground group-hover:text-cyan-400 transition-colors">
                          {lab.title}
                        </h3>
                        <span className="text-xs text-muted-foreground">{lab.category}</span>
                      </div>
                    </div>
                    <span className={`text-xs px-2 py-1 rounded-full ${difficultyColors[lab.difficulty]}`}>
                      {lab.difficulty}
                    </span>
                  </div>

                  <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                    {lab.description}
                  </p>

                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">{lab.challenges} challenges</span>
                    <span className="text-muted-foreground">{lab.users.toLocaleString()} hackers</span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {filteredLabs.length === 0 && (
            <div className="text-center py-16">
              <p className="text-muted-foreground">No labs found matching your criteria.</p>
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Labs;
