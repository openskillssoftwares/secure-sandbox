import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { User, Shield, Trophy, CreditCard, Settings, Lock } from "lucide-react";
import ProfileSection from "@/components/dashboard/ProfileSection";
import SecuritySection from "@/components/dashboard/SecuritySection";
import LabProgressSection from "@/components/dashboard/LabProgressSection";
import SubscriptionSection from "@/components/dashboard/SubscriptionSection";
import AccountSettings from "@/components/dashboard/AccountSettings";

const Dashboard = () => {
  const { user, profile, loading } = useAuth();
  const [activeTab, setActiveTab] = useState("profile");

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-400 mx-auto mb-4" />
          <p className="text-muted-foreground">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Shield className="h-16 w-16 text-cyan-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-2">Authentication Required</h2>
          <p className="text-muted-foreground">Please log in to view your dashboard</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-border/50 bg-card/30 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center gap-4">
            {profile?.avatar_url ? (
              <img
                src={profile.avatar_url}
                alt={profile.username}
                className="w-16 h-16 rounded-full border-2 border-cyan-400"
              />
            ) : (
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-cyan-400 to-green-400 flex items-center justify-center">
                <User className="h-8 w-8 text-background" />
              </div>
            )}
            <div>
              <h1 className="text-2xl font-bold text-foreground">
                Welcome back, {profile?.username || "User"}!
              </h1>
              <p className="text-muted-foreground">{user.email}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Dashboard Content */}
      <div className="container mx-auto px-4 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2 md:grid-cols-5 gap-2 bg-card/50 p-2 rounded-lg mb-8">
            <TabsTrigger
              value="profile"
              className="flex items-center gap-2 data-[state=active]:bg-cyan-400/10 data-[state=active]:text-cyan-400"
            >
              <User className="h-4 w-4" />
              <span className="hidden sm:inline">Profile</span>
            </TabsTrigger>
            <TabsTrigger
              value="labs"
              className="flex items-center gap-2 data-[state=active]:bg-cyan-400/10 data-[state=active]:text-cyan-400"
            >
              <Trophy className="h-4 w-4" />
              <span className="hidden sm:inline">Labs</span>
            </TabsTrigger>
            <TabsTrigger
              value="security"
              className="flex items-center gap-2 data-[state=active]:bg-cyan-400/10 data-[state=active]:text-cyan-400"
            >
              <Lock className="h-4 w-4" />
              <span className="hidden sm:inline">Security</span>
            </TabsTrigger>
            <TabsTrigger
              value="subscription"
              className="flex items-center gap-2 data-[state=active]:bg-cyan-400/10 data-[state=active]:text-cyan-400"
            >
              <CreditCard className="h-4 w-4" />
              <span className="hidden sm:inline">Billing</span>
            </TabsTrigger>
            <TabsTrigger
              value="settings"
              className="flex items-center gap-2 data-[state=active]:bg-cyan-400/10 data-[state=active]:text-cyan-400"
            >
              <Settings className="h-4 w-4" />
              <span className="hidden sm:inline">Settings</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="profile" className="space-y-6">
            <ProfileSection />
          </TabsContent>

          <TabsContent value="labs" className="space-y-6">
            <LabProgressSection />
          </TabsContent>

          <TabsContent value="security" className="space-y-6">
            <SecuritySection />
          </TabsContent>

          <TabsContent value="subscription" className="space-y-6">
            <SubscriptionSection />
          </TabsContent>

          <TabsContent value="settings" className="space-y-6">
            <AccountSettings />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Dashboard;
