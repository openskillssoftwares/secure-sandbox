import { Database, Globe, Lock, Server, ShieldOff, Key, AlertTriangle, Bug, Network, Fingerprint, CreditCard, Eye } from "lucide-react";
import sqlInjection from "@/assets/sql-injection.jpg";
import xssAttack from "@/assets/xss-attack.jpg";
import brokenAuth from "@/assets/broken-auth.jpg";

const labs = [
  {
    icon: Database,
    title: "SQL Injection",
    description: "Master database exploitation techniques and learn to extract sensitive data.",
    difficulty: "Easy to Impossible",
    image: sqlInjection,
    challenges: 15,
  },
  {
    icon: Globe,
    title: "Cross-Site Scripting (XSS)",
    description: "Inject malicious scripts and understand client-side vulnerabilities.",
    difficulty: "Easy to Hard",
    image: xssAttack,
    challenges: 12,
  },
  {
    icon: Lock,
    title: "Broken Authentication",
    description: "Exploit authentication flaws and session management weaknesses.",
    difficulty: "Medium to Hard",
    image: brokenAuth,
    challenges: 10,
  },
  {
    icon: ShieldOff,
    title: "Broken Access Control",
    description: "Bypass authorization controls and access restricted resources.",
    difficulty: "Medium",
    challenges: 8,
  },
  {
    icon: Server,
    title: "SSRF Attacks",
    description: "Server-Side Request Forgery to access internal systems.",
    difficulty: "Hard",
    challenges: 6,
  },
  {
    icon: Key,
    title: "Cryptographic Failures",
    description: "Exploit weak encryption and sensitive data exposure.",
    difficulty: "Hard to Impossible",
    challenges: 8,
  },
  {
    icon: AlertTriangle,
    title: "Security Misconfiguration",
    description: "Find and exploit misconfigured servers and services.",
    difficulty: "Easy to Medium",
    challenges: 10,
  },
  {
    icon: Bug,
    title: "Insecure Design",
    description: "Identify architectural flaws and design weaknesses.",
    difficulty: "Medium to Hard",
    challenges: 7,
  },
  {
    icon: Network,
    title: "Port Vulnerabilities",
    description: "Scan and exploit open ports and network services.",
    difficulty: "Medium",
    challenges: 9,
  },
  {
    icon: Fingerprint,
    title: "Session Hijacking",
    description: "Steal and manipulate user sessions.",
    difficulty: "Hard",
    challenges: 6,
  },
  {
    icon: CreditCard,
    title: "Banking Vulnerabilities",
    description: "Real-world banking system exploitation scenarios.",
    difficulty: "Impossible",
    challenges: 5,
  },
  {
    icon: Eye,
    title: "System Exploitation",
    description: "Full system compromise challenges like TryHackMe.",
    difficulty: "Hard to Impossible",
    challenges: 4,
  },
];

const getDifficultyBadge = (difficulty: string) => {
  if (difficulty.includes("Impossible")) return "badge-impossible";
  if (difficulty.includes("Hard")) return "badge-hard";
  if (difficulty.includes("Medium")) return "badge-medium";
  return "badge-easy";
};

const LabsSection = () => {
  return (
    <section className="py-24 relative">
      <div className="absolute inset-0 cyber-grid opacity-20" />
      
      <div className="container mx-auto px-4 relative z-10">
        {/* Section Header */}
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-5xl font-bold mb-4">
            <span className="bg-gradient-to-r from-cyan-400 to-green-400 bg-clip-text text-transparent">
              Vulnerability Labs
            </span>
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Practice real-world vulnerabilities in isolated sandbox environments. 
            From beginner to expert-level challenges.
          </p>
        </div>

        {/* Labs Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {labs.map((lab, index) => (
            <div
              key={index}
              className="card-cyber p-6 transition-all duration-300 hover:border-cyan-500/50 hover:-translate-y-1 group cursor-pointer"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              {lab.image && (
                <div className="relative h-32 mb-4 rounded-lg overflow-hidden">
                  <img 
                    src={lab.image} 
                    alt={lab.title}
                    className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-card to-transparent" />
                </div>
              )}
              
              {!lab.image && (
                <div className="h-12 w-12 rounded-lg bg-cyan-500/10 flex items-center justify-center mb-4 group-hover:bg-cyan-500/20 transition-colors">
                  <lab.icon className="h-6 w-6 text-cyan-400" />
                </div>
              )}

              <h3 className="text-lg font-semibold text-foreground mb-2 group-hover:text-cyan-400 transition-colors">
                {lab.title}
              </h3>
              <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                {lab.description}
              </p>

              <div className="flex items-center justify-between">
                <span className={`text-xs px-2 py-1 rounded-full ${getDifficultyBadge(lab.difficulty)}`}>
                  {lab.difficulty}
                </span>
                <span className="text-xs text-muted-foreground">
                  {lab.challenges} challenges
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default LabsSection;
