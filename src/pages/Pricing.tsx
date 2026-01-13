import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Check, Zap, Crown, Sparkles } from "lucide-react";
import { Link } from "react-router-dom";

const plans = [
  {
    name: "Free",
    price: "₹0",
    period: "forever",
    description: "Get started with ethical hacking basics",
    icon: Zap,
    features: [
      "5 hours practice per day",
      "Access to 10 beginner labs",
      "Basic challenges only",
      "Community support",
      "Progress tracking",
      "Basic completion badges",
    ],
    limitations: [
      "Limited lab access",
      "No advanced challenges",
      "No certificates",
    ],
    cta: "Start Free",
    popular: false,
    gradient: "from-slate-600 to-slate-700",
  },
  {
    name: "Starter",
    price: "₹499",
    period: "per month",
    description: "Perfect for serious learners",
    icon: Sparkles,
    features: [
      "7 hours practice per day",
      "Access to 30+ labs",
      "Easy & Medium challenges",
      "Email support",
      "Progress tracking",
      "Completion certificates",
      "Monthly webinars",
      "Skill assessments",
    ],
    limitations: [],
    cta: "Start Learning",
    popular: true,
    gradient: "from-cyan-500 to-green-500",
  },
  {
    name: "Unlimited",
    price: "₹1,499",
    period: "per month",
    description: "For professional pentesters",
    icon: Crown,
    features: [
      "Unlimited practice time",
      "Access to ALL 50+ labs",
      "All difficulty levels including Impossible",
      "Priority support",
      "Advanced challenges",
      "Professional certificates",
      "1-on-1 mentorship sessions",
      "Early access to new labs",
      "Private Discord channel",
      "Resume review service",
      "Job referrals",
    ],
    limitations: [],
    cta: "Go Unlimited",
    popular: false,
    gradient: "from-orange-500 to-red-500",
  },
];

const faqs = [
  {
    q: "Can I switch plans anytime?",
    a: "Yes! You can upgrade or downgrade your plan at any time. Changes take effect immediately.",
  },
  {
    q: "Is there a free trial for paid plans?",
    a: "We offer a 7-day money-back guarantee on all paid plans. Try risk-free!",
  },
  {
    q: "What payment methods do you accept?",
    a: "We accept all major credit cards, debit cards, UPI, and net banking through Razorpay.",
  },
  {
    q: "Do you offer team or enterprise plans?",
    a: "Yes! Contact us for custom enterprise pricing with team management features.",
  },
];

const Pricing = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <main className="pt-24 pb-16">
        <div className="container mx-auto px-4">
          {/* Header */}
          <div className="text-center mb-16">
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              <span className="bg-gradient-to-r from-cyan-400 to-green-400 bg-clip-text text-transparent">
                Simple, Transparent Pricing
              </span>
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Choose the plan that fits your learning goals. Start free and upgrade as you progress.
            </p>
          </div>

          {/* Pricing Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto mb-20">
            {plans.map((plan, index) => (
              <div
                key={index}
                className={`card-cyber p-8 relative transition-all duration-300 hover:-translate-y-2 ${
                  plan.popular ? "border-cyan-500 shadow-[0_0_30px_hsl(190_100%_50%_/_0.2)]" : ""
                }`}
              >
                {plan.popular && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                    <span className="bg-gradient-to-r from-cyan-500 to-green-500 text-black text-sm font-bold px-4 py-1 rounded-full">
                      Most Popular
                    </span>
                  </div>
                )}

                <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${plan.gradient} flex items-center justify-center mb-6`}>
                  <plan.icon className="h-7 w-7 text-white" />
                </div>

                <h3 className="text-2xl font-bold text-foreground mb-2">{plan.name}</h3>
                <p className="text-muted-foreground text-sm mb-4">{plan.description}</p>

                <div className="mb-6">
                  <span className="text-4xl font-black text-foreground">{plan.price}</span>
                  <span className="text-muted-foreground ml-2">/{plan.period}</span>
                </div>

                <ul className="space-y-3 mb-8">
                  {plan.features.map((feature, idx) => (
                    <li key={idx} className="flex items-start gap-3">
                      <Check className="h-5 w-5 text-green-400 shrink-0 mt-0.5" />
                      <span className="text-sm text-foreground">{feature}</span>
                    </li>
                  ))}
                </ul>

                <Link to="/signup">
                  <Button
                    variant={plan.popular ? "cyber" : "cyber-outline"}
                    className="w-full"
                    size="lg"
                  >
                    {plan.cta}
                  </Button>
                </Link>
              </div>
            ))}
          </div>

          {/* Trust Badge */}
          <div className="text-center mb-20">
            <p className="text-muted-foreground">
              🔒 Secured by Razorpay • Cancel anytime • 7-day money-back guarantee
            </p>
          </div>

          {/* FAQs */}
          <div className="max-w-3xl mx-auto">
            <h2 className="text-2xl font-bold text-center mb-8 text-foreground">
              Frequently Asked Questions
            </h2>
            <div className="space-y-4">
              {faqs.map((faq, index) => (
                <div key={index} className="card-cyber p-6">
                  <h3 className="font-semibold text-foreground mb-2">{faq.q}</h3>
                  <p className="text-muted-foreground text-sm">{faq.a}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Pricing;
