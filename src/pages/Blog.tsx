import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Calendar, Clock, User, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";

const blogPosts = [
  {
    id: 1,
    title: "Understanding SQL Injection: A Beginner's Guide",
    excerpt: "Learn the fundamentals of SQL injection attacks and how to protect your applications from this common vulnerability.",
    author: "Security Team",
    date: "Jan 10, 2025",
    readTime: "8 min read",
    category: "Tutorial",
  },
  {
    id: 2,
    title: "Top 10 Web Application Vulnerabilities in 2025",
    excerpt: "An in-depth look at the most critical web application security risks and how to mitigate them.",
    author: "CyberLabs Research",
    date: "Jan 8, 2025",
    readTime: "12 min read",
    category: "Research",
  },
  {
    id: 3,
    title: "Career Path: From Beginner to Penetration Tester",
    excerpt: "A comprehensive guide to building your career in cybersecurity and penetration testing.",
    author: "Career Team",
    date: "Jan 5, 2025",
    readTime: "10 min read",
    category: "Career",
  },
  {
    id: 4,
    title: "XSS Attacks Explained: Types and Prevention",
    excerpt: "Deep dive into cross-site scripting attacks, including reflected, stored, and DOM-based XSS.",
    author: "Security Team",
    date: "Jan 3, 2025",
    readTime: "15 min read",
    category: "Tutorial",
  },
  {
    id: 5,
    title: "Setting Up Your First Bug Bounty Lab",
    excerpt: "Step-by-step guide to creating a safe environment for practicing bug bounty hunting.",
    author: "Lab Team",
    date: "Dec 28, 2024",
    readTime: "6 min read",
    category: "Guide",
  },
  {
    id: 6,
    title: "The Psychology of Social Engineering",
    excerpt: "Understanding the human element in cybersecurity and how attackers exploit it.",
    author: "Research Team",
    date: "Dec 25, 2024",
    readTime: "9 min read",
    category: "Research",
  },
];

const Blog = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <main className="pt-24 pb-16">
        <div className="container mx-auto px-4">
          {/* Header */}
          <div className="text-center mb-16">
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              <span className="bg-gradient-to-r from-cyan-400 to-green-400 bg-clip-text text-transparent">
                CyberLabs Blog
              </span>
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Security tutorials, research, and industry insights from our team.
            </p>
          </div>

          {/* Blog Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {blogPosts.map((post) => (
              <article key={post.id} className="card-cyber overflow-hidden group cursor-pointer hover:border-cyan-500/50 transition-all duration-300">
                <div className="p-6">
                  <span className="text-xs px-2 py-1 rounded-full bg-cyan-500/20 text-cyan-400 mb-4 inline-block">
                    {post.category}
                  </span>

                  <h2 className="text-xl font-semibold text-foreground mb-3 group-hover:text-cyan-400 transition-colors">
                    {post.title}
                  </h2>

                  <p className="text-muted-foreground text-sm mb-4 line-clamp-3">
                    {post.excerpt}
                  </p>

                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <div className="flex items-center gap-4">
                      <span className="flex items-center gap-1">
                        <User className="h-3 w-3" />
                        {post.author}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {post.readTime}
                      </span>
                    </div>
                    <span>{post.date}</span>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Blog;
