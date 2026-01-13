import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Check, Clock, Rocket, Target, Zap } from "lucide-react";

const roadmapItems = [
  {
    quarter: "Q1 2025",
    status: "completed",
    title: "Platform Launch",
    items: [
      "Core vulnerability labs",
      "User authentication system",
      "Basic subscription tiers",
      "Progress tracking",
    ],
  },
  {
    quarter: "Q2 2025",
    status: "in-progress",
    title: "Enhanced Labs",
    items: [
      "Advanced SQL injection labs",
      "SSRF attack scenarios",
      "Banking vulnerability simulations",
      "Real-time hint system",
    ],
  },
  {
    quarter: "Q3 2025",
    status: "planned",
    title: "Team Features",
    items: [
      "Team management dashboard",
      "Company leaderboards",
      "Custom lab creation",
      "API access for enterprises",
    ],
  },
  {
    quarter: "Q4 2025",
    status: "planned",
    title: "Mobile & Advanced",
    items: [
      "Mobile app launch",
      "AI-powered learning paths",
      "Live CTF competitions",
      "Certification programs",
    ],
  },
];

const statusConfig = {
  completed: { icon: Check, color: "text-green-400", bg: "bg-green-500/20" },
  "in-progress": { icon: Rocket, color: "text-cyan-400", bg: "bg-cyan-500/20" },
  planned: { icon: Target, color: "text-muted-foreground", bg: "bg-muted" },
};

const Roadmap = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <main className="pt-24 pb-16">
        <div className="container mx-auto px-4">
          {/* Header */}
          <div className="text-center mb-16">
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              <span className="bg-gradient-to-r from-cyan-400 to-green-400 bg-clip-text text-transparent">
                Product Roadmap
              </span>
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              See what we're building next. Our roadmap is driven by community feedback.
            </p>
          </div>

          {/* Timeline */}
          <div className="max-w-4xl mx-auto">
            <div className="relative">
              {/* Vertical Line */}
              <div className="absolute left-8 top-0 bottom-0 w-0.5 bg-border hidden md:block" />

              <div className="space-y-12">
                {roadmapItems.map((item, index) => {
                  const config = statusConfig[item.status as keyof typeof statusConfig];
                  const Icon = config.icon;

                  return (
                    <div key={index} className="relative flex gap-8">
                      {/* Icon */}
                      <div className={`hidden md:flex w-16 h-16 rounded-full ${config.bg} items-center justify-center shrink-0 z-10`}>
                        <Icon className={`h-8 w-8 ${config.color}`} />
                      </div>

                      {/* Content */}
                      <div className="card-cyber p-6 flex-1">
                        <div className="flex items-center gap-4 mb-4">
                          <span className={`text-sm font-medium ${config.color}`}>
                            {item.quarter}
                          </span>
                          <span className={`text-xs px-2 py-1 rounded-full ${config.bg} ${config.color}`}>
                            {item.status === "completed" && "Completed"}
                            {item.status === "in-progress" && "In Progress"}
                            {item.status === "planned" && "Planned"}
                          </span>
                        </div>

                        <h3 className="text-xl font-bold text-foreground mb-4">{item.title}</h3>

                        <ul className="space-y-2">
                          {item.items.map((feature, idx) => (
                            <li key={idx} className="flex items-center gap-3 text-muted-foreground">
                              <Check className={`h-4 w-4 ${item.status === "completed" ? "text-green-400" : "text-muted-foreground"}`} />
                              {feature}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Roadmap;
