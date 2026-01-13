import { Button } from "@/components/ui/button";
import { ArrowRight, Rocket } from "lucide-react";
import { Link } from "react-router-dom";

const CTASection = () => {
  return (
    <section className="py-24 relative overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/10 via-transparent to-green-500/10" />
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-cyan-500/20 rounded-full blur-3xl" />
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-green-500/20 rounded-full blur-3xl" />
      
      <div className="container mx-auto px-4 relative z-10">
        <div className="max-w-4xl mx-auto text-center">
          {/* Icon */}
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-cyan-500 to-green-500 mb-8 animate-glow-pulse">
            <Rocket className="h-10 w-10 text-black" />
          </div>

          {/* Heading */}
          <h2 className="text-3xl md:text-5xl font-bold mb-6">
            <span className="text-foreground">Ready to Become an </span>
            <span className="bg-gradient-to-r from-cyan-400 to-green-400 bg-clip-text text-transparent">
              Ethical Hacker?
            </span>
          </h2>

          {/* Description */}
          <p className="text-lg text-muted-foreground mb-10 max-w-2xl mx-auto">
            Join thousands of security professionals learning real-world hacking skills. 
            Start your journey today with our free tier.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/signup">
              <Button variant="cyber" size="xl" className="w-full sm:w-auto group">
                Create Free Account
                <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
              </Button>
            </Link>
            <Link to="/labs">
              <Button variant="cyber-outline" size="xl" className="w-full sm:w-auto">
                Browse Labs
              </Button>
            </Link>
          </div>

          {/* Trust Text */}
          <p className="mt-8 text-sm text-muted-foreground">
            No credit card required • Free forever plan available
          </p>
        </div>
      </div>
    </section>
  );
};

export default CTASection;
