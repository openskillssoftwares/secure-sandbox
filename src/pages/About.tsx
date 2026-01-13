import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Shield, Users, Target, Award } from "lucide-react";

const About = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <main className="pt-24 pb-16">
        <div className="container mx-auto px-4">
          {/* Hero */}
          <div className="text-center mb-16">
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              <span className="bg-gradient-to-r from-cyan-400 to-green-400 bg-clip-text text-transparent">
                About CyberLabs
              </span>
            </h1>
            <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
              We're on a mission to make cybersecurity education accessible to everyone. 
              Learn ethical hacking through hands-on practice in safe, isolated environments.
            </p>
          </div>

          {/* Values */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-20">
            {[
              {
                icon: Shield,
                title: "Security First",
                description: "All labs run in completely isolated sandboxes. Your practice stays safe.",
              },
              {
                icon: Users,
                title: "Community Driven",
                description: "Built by security professionals for the next generation of ethical hackers.",
              },
              {
                icon: Target,
                title: "Real-World Focus",
                description: "Practice actual vulnerabilities you'll encounter in the field.",
              },
              {
                icon: Award,
                title: "Industry Recognition",
                description: "Our certifications are recognized by leading security companies.",
              },
            ].map((value, index) => (
              <div key={index} className="card-cyber p-6 text-center">
                <div className="w-14 h-14 rounded-xl bg-cyan-500/10 flex items-center justify-center mx-auto mb-4">
                  <value.icon className="h-7 w-7 text-cyan-400" />
                </div>
                <h3 className="text-lg font-semibold text-foreground mb-2">{value.title}</h3>
                <p className="text-sm text-muted-foreground">{value.description}</p>
              </div>
            ))}
          </div>

          {/* Story */}
          <div className="max-w-4xl mx-auto">
            <div className="card-cyber p-8 md:p-12">
              <h2 className="text-2xl font-bold text-foreground mb-6">Our Story</h2>
              <div className="space-y-4 text-muted-foreground">
                <p>
                  CyberLabs was founded with a simple belief: the best way to learn cybersecurity 
                  is by doing. Traditional courses teach theory, but real skill comes from hands-on 
                  practice with actual vulnerabilities.
                </p>
                <p>
                  Our platform provides a safe, legal environment where aspiring security professionals 
                  can practice their skills. From SQL injection to full system compromise, we offer 
                  challenges that mirror real-world scenarios.
                </p>
                <p>
                  Today, we're proud to support thousands of ethical hackers on their journey. 
                  Whether you're a beginner taking your first steps or a professional sharpening 
                  your skills, CyberLabs is here to help you grow.
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default About;
