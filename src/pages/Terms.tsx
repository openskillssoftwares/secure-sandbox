import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

const Terms = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <main className="pt-24 pb-16">
        <div className="container mx-auto px-4 max-w-4xl">
          <h1 className="text-4xl font-bold mb-8 text-foreground">Terms of Service</h1>
          
          <div className="card-cyber p-8 prose prose-invert max-w-none">
            <p className="text-muted-foreground mb-6">Last updated: January 2025</p>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-foreground mb-4">1. Acceptance of Terms</h2>
              <p className="text-muted-foreground">
                By accessing and using CyberLabs, you agree to be bound by these Terms of Service. 
                If you do not agree to these terms, please do not use our services.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-foreground mb-4">2. Ethical Use Policy</h2>
              <p className="text-muted-foreground mb-4">
                CyberLabs is designed for educational purposes only. You agree to:
              </p>
              <ul className="list-disc pl-6 text-muted-foreground space-y-2">
                <li>Only practice hacking skills within our sandboxed environments</li>
                <li>Never use skills learned here for malicious purposes</li>
                <li>Report any security vulnerabilities responsibly</li>
                <li>Not attempt to access systems outside the designated lab environment</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-foreground mb-4">3. Account Responsibilities</h2>
              <p className="text-muted-foreground">
                You are responsible for maintaining the security of your account and all activities 
                that occur under your account. You must immediately notify us of any unauthorized use.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-foreground mb-4">4. Subscription and Payments</h2>
              <p className="text-muted-foreground">
                Paid subscriptions are billed according to the plan you choose. Payments are processed 
                through Razorpay. You can cancel your subscription at any time, and it will remain 
                active until the end of the current billing period.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-foreground mb-4">5. Limitation of Liability</h2>
              <p className="text-muted-foreground">
                CyberLabs is provided "as is" without warranties of any kind. We are not liable for 
                any damages arising from your use of our services or any skills learned through our platform.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-foreground mb-4">6. Contact</h2>
              <p className="text-muted-foreground">
                For questions about these Terms, contact us at legal@cyberlabs.com.
              </p>
            </section>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Terms;
