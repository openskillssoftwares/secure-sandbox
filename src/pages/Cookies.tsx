import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

const Cookies = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <main className="pt-24 pb-16">
        <div className="container mx-auto px-4 max-w-4xl">
          <h1 className="text-4xl font-bold mb-8 text-foreground">Cookie Policy</h1>
          
          <div className="card-cyber p-8 prose prose-invert max-w-none">
            <p className="text-muted-foreground mb-6">Last updated: January 2025</p>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-foreground mb-4">What Are Cookies</h2>
              <p className="text-muted-foreground">
                Cookies are small text files stored on your device when you visit our website. 
                They help us provide you with a better experience by remembering your preferences 
                and understanding how you use our site.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-foreground mb-4">How We Use Cookies</h2>
              <ul className="list-disc pl-6 text-muted-foreground space-y-2">
                <li><strong>Essential Cookies:</strong> Required for the website to function properly</li>
                <li><strong>Analytics Cookies:</strong> Help us understand how visitors interact with our site</li>
                <li><strong>Preference Cookies:</strong> Remember your settings and preferences</li>
                <li><strong>Session Cookies:</strong> Keep you logged in during your visit</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-foreground mb-4">Managing Cookies</h2>
              <p className="text-muted-foreground">
                You can control and manage cookies through your browser settings. Note that 
                disabling certain cookies may affect the functionality of our website.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-foreground mb-4">Contact Us</h2>
              <p className="text-muted-foreground">
                If you have questions about our use of cookies, please contact us at privacy@cyberlabs.com.
              </p>
            </section>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Cookies;
