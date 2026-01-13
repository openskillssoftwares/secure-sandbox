import { Shield, Lock, Cpu, Cloud, Target, Fingerprint } from "lucide-react";

const features = [
  {
    icon: Shield,
    title: "Isolated Sandboxes",
    description: "Practice in completely isolated environments. Your attacks stay contained and safe.",
  },
  {
    icon: Lock,
    title: "Real Vulnerabilities",
    description: "Exploit actual CVEs and OWASP Top 10 vulnerabilities in realistic scenarios.",
  },
  {
    icon: Cpu,
    title: "Instant Lab Access",
    description: "No setup required. Launch labs instantly and start hacking in seconds.",
  },
  {
    icon: Cloud,
    title: "Cloud-Based",
    description: "Access from anywhere. All you need is a browser and an internet connection.",
  },
  {
    icon: Target,
    title: "Guided Learning",
    description: "Step-by-step hints and walkthroughs for every challenge when you need help.",
  },
  {
    icon: Fingerprint,
    title: "Progress Tracking",
    description: "Track your skills, earn badges, and showcase your achievements.",
  },
];

const FeaturesSection = () => {
  return (
    <section className="py-24 relative">
      <div className="container mx-auto px-4">
        {/* Section Header */}
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-5xl font-bold mb-4">
            <span className="text-foreground">Why </span>
            <span className="bg-gradient-to-r from-cyan-400 to-green-400 bg-clip-text text-transparent">
              CyberLabs?
            </span>
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            The most comprehensive platform for learning ethical hacking with hands-on practice.
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <div
              key={index}
              className="group relative p-8 rounded-2xl bg-gradient-to-br from-muted/50 to-transparent border border-border hover:border-cyan-500/50 transition-all duration-300"
            >
              {/* Glow Effect */}
              <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-cyan-500/5 to-green-500/5 opacity-0 group-hover:opacity-100 transition-opacity" />
              
              <div className="relative">
                <div className="w-14 h-14 rounded-xl bg-cyan-500/10 flex items-center justify-center mb-6 group-hover:bg-cyan-500/20 transition-colors">
                  <feature.icon className="h-7 w-7 text-cyan-400" />
                </div>
                
                <h3 className="text-xl font-semibold text-foreground mb-3 group-hover:text-cyan-400 transition-colors">
                  {feature.title}
                </h3>
                
                <p className="text-muted-foreground">
                  {feature.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default FeaturesSection;
