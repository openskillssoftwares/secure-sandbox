import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

const Privacy = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <main className="pt-24 pb-16">
        <div className="container mx-auto px-4 max-w-4xl">
          <h1 className="text-4xl font-bold mb-8 text-foreground">Privacy Policy</h1>
          
          <div className="card-cyber p-8 prose prose-invert max-w-none">
            <p className="text-muted-foreground mb-6">Last updated: January 2025</p>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-foreground mb-4">1. Information We Collect</h2>
              <p className="text-muted-foreground mb-4">
                We collect information you provide directly to us, including:
              </p>
              <ul className="list-disc pl-6 text-muted-foreground space-y-2">
                <li>Account information (name, email, password)</li>
                <li>Payment information (processed securely via Razorpay)</li>
                <li>Usage data and lab progress</li>
                <li>Communications with our support team</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-foreground mb-4">2. How We Use Your Information</h2>
              <p className="text-muted-foreground mb-4">
                We use the information we collect to:
              </p>
              <ul className="list-disc pl-6 text-muted-foreground space-y-2">
                <li>Provide and maintain our services</li>
                <li>Process transactions and send related information</li>
                <li>Track your progress and provide personalized recommendations</li>
                <li>Send technical notices and support messages</li>
                <li>Respond to your comments and questions</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-foreground mb-4">3. Data Security</h2>
              <p className="text-muted-foreground">
                We implement industry-standard security measures to protect your data. 
                All data is encrypted in transit and at rest. We regularly audit our 
                security practices and update them as needed.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-foreground mb-4">4. Your Rights</h2>
              <p className="text-muted-foreground">
                You have the right to access, update, or delete your personal information 
                at any time. Contact us at privacy@cyberlabs.com for any data-related requests.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-foreground mb-4">5. Contact Us</h2>
              <p className="text-muted-foreground">
                If you have any questions about this Privacy Policy, please contact us at 
                privacy@cyberlabs.com.
              </p>
            </section>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Privacy;
