import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Settings,
  Bell,
  Shield,
  Download,
  Trash2,
  CheckCircle,
  AlertTriangle,
} from "lucide-react";

const AccountSettings = () => {
  const { user, signOut } = useAuth();
  const { toast } = useToast();
  const [deletePassword, setDeletePassword] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  // Notification preferences
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [labNotifications, setLabNotifications] = useState(true);
  const [blogNotifications, setBlogNotifications] = useState(false);
  const [securityNotifications, setSecurityNotifications] = useState(true);

  // Privacy preferences
  const [profilePublic, setProfilePublic] = useState(true);
  const [showProgress, setShowProgress] = useState(true);
  const [showOnLeaderboard, setShowOnLeaderboard] = useState(true);

  const handleExportData = async () => {
    setIsExporting(true);

    try {
      // Fetch user data from all tables
      const [profileData, labProgressData, paymentData] = await Promise.all([
        supabase.from("profiles").select("*").eq("user_id", user?.id).single(),
        supabase.from("lab_progress").select("*").eq("user_id", user?.id),
        supabase.from("payment_history").select("*").eq("user_id", user?.id),
      ]);

      const exportData = {
        user: {
          id: user?.id,
          email: user?.email,
          created_at: user?.created_at,
        },
        profile: profileData.data,
        lab_progress: labProgressData.data,
        payment_history: paymentData.data,
        exported_at: new Date().toISOString(),
      };

      // Create JSON blob and download
      const blob = new Blob([JSON.stringify(exportData, null, 2)], {
        type: "application/json",
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `secure-sandbox-data-${new Date().toISOString().split("T")[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast({
        title: "Data exported",
        description: "Your data has been downloaded successfully",
      });
    } catch (error: any) {
      toast({
        title: "Export failed",
        description: error.message || "Failed to export data",
        variant: "destructive",
      });
    } finally {
      setIsExporting(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (!deletePassword) {
      toast({
        title: "Password required",
        description: "Please enter your password to confirm account deletion",
        variant: "destructive",
      });
      return;
    }

    setIsDeleting(true);

    try {
      // Verify password first
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: user?.email || "",
        password: deletePassword,
      });

      if (signInError) {
        throw new Error("Invalid password");
      }

      // Delete related data (cascade should handle most, but explicit deletion is safer)
      await Promise.all([
        supabase.from("lab_progress").delete().eq("user_id", user?.id),
        supabase.from("bug_reports").delete().eq("user_id", user?.id),
        supabase.from("user_subscriptions").delete().eq("user_id", user?.id),
        supabase.from("profiles").delete().eq("user_id", user?.id),
      ]);

      // Delete auth user
      const { error: deleteError } = await supabase.auth.admin.deleteUser(user?.id || "");

      if (deleteError) throw deleteError;

      toast({
        title: "Account deleted",
        description: "Your account has been permanently deleted",
      });

      // Sign out and redirect
      await signOut();
    } catch (error: any) {
      toast({
        title: "Deletion failed",
        description: error.message || "Failed to delete account",
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
      setDeletePassword("");
    }
  };

  return (
    <div className="space-y-6">
      {/* Notification Preferences */}
      <Card className="card-cyber">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5 text-cyan-400" />
            Notification Preferences
          </CardTitle>
          <CardDescription>Manage how you receive notifications</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="email-notifications" className="font-medium">
                Email Notifications
              </Label>
              <p className="text-sm text-muted-foreground">
                Receive notifications via email
              </p>
            </div>
            <Switch
              id="email-notifications"
              checked={emailNotifications}
              onCheckedChange={setEmailNotifications}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="lab-notifications" className="font-medium">
                Lab Completions
              </Label>
              <p className="text-sm text-muted-foreground">
                Notify when you complete a lab or earn achievements
              </p>
            </div>
            <Switch
              id="lab-notifications"
              checked={labNotifications}
              onCheckedChange={setLabNotifications}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="blog-notifications" className="font-medium">
                New Content
              </Label>
              <p className="text-sm text-muted-foreground">
                Notify about new blog posts and labs
              </p>
            </div>
            <Switch
              id="blog-notifications"
              checked={blogNotifications}
              onCheckedChange={setBlogNotifications}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="security-notifications" className="font-medium">
                Security Alerts
              </Label>
              <p className="text-sm text-muted-foreground">
                Important security updates and login alerts
              </p>
            </div>
            <Switch
              id="security-notifications"
              checked={securityNotifications}
              onCheckedChange={setSecurityNotifications}
              disabled
            />
          </div>
        </CardContent>
      </Card>

      {/* Privacy Settings */}
      <Card className="card-cyber">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-cyan-400" />
            Privacy Settings
          </CardTitle>
          <CardDescription>Control your profile visibility</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="profile-public" className="font-medium">
                Public Profile
              </Label>
              <p className="text-sm text-muted-foreground">
                Allow others to view your profile
              </p>
            </div>
            <Switch
              id="profile-public"
              checked={profilePublic}
              onCheckedChange={setProfilePublic}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="show-progress" className="font-medium">
                Show Lab Progress
              </Label>
              <p className="text-sm text-muted-foreground">
                Display your completed labs on your profile
              </p>
            </div>
            <Switch
              id="show-progress"
              checked={showProgress}
              onCheckedChange={setShowProgress}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="show-leaderboard" className="font-medium">
                Show on Leaderboard
              </Label>
              <p className="text-sm text-muted-foreground">
                Appear on global leaderboards
              </p>
            </div>
            <Switch
              id="show-leaderboard"
              checked={showOnLeaderboard}
              onCheckedChange={setShowOnLeaderboard}
            />
          </div>
        </CardContent>
      </Card>

      {/* Data Export */}
      <Card className="card-cyber">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Download className="h-5 w-5 text-cyan-400" />
            Export Your Data
          </CardTitle>
          <CardDescription>Download a copy of your data</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <CheckCircle className="h-5 w-5 text-green-400 mt-0.5" />
              <div>
                <p className="font-medium">Complete Data Export</p>
                <p className="text-sm text-muted-foreground">
                  Includes profile, lab progress, payment history, and account information
                </p>
              </div>
            </div>
            <Button
              variant="cyber-outline"
              onClick={handleExportData}
              disabled={isExporting}
            >
              {isExporting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-cyan-400 mr-2" />
                  Exporting...
                </>
              ) : (
                <>
                  <Download className="h-4 w-4 mr-2" />
                  Export Data
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Danger Zone */}
      <Card className="card-cyber border-red-500/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-red-400">
            <AlertTriangle className="h-5 w-5" />
            Danger Zone
          </CardTitle>
          <CardDescription>Irreversible account actions</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="p-4 bg-red-500/10 rounded-lg border border-red-500/20">
              <div className="flex items-start gap-3 mb-4">
                <Trash2 className="h-5 w-5 text-red-400 mt-0.5" />
                <div>
                  <p className="font-medium text-red-400">Delete Account</p>
                  <p className="text-sm text-muted-foreground">
                    Permanently delete your account and all associated data. This action cannot
                    be undone.
                  </p>
                </div>
              </div>

              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive" size="sm">
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete Account
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent className="bg-background border-red-500/20">
                  <AlertDialogHeader>
                    <AlertDialogTitle className="text-red-400">
                      Are you absolutely sure?
                    </AlertDialogTitle>
                    <AlertDialogDescription>
                      This action cannot be undone. This will permanently delete your account and
                      remove all your data from our servers.
                    </AlertDialogDescription>
                  </AlertDialogHeader>

                  <div className="space-y-2">
                    <Label htmlFor="delete-password">
                      Enter your password to confirm
                    </Label>
                    <Input
                      id="delete-password"
                      type="password"
                      placeholder="Password"
                      value={deletePassword}
                      onChange={(e) => setDeletePassword(e.target.value)}
                      className="input-cyber"
                    />
                  </div>

                  <AlertDialogFooter>
                    <AlertDialogCancel onClick={() => setDeletePassword("")}>
                      Cancel
                    </AlertDialogCancel>
                    <AlertDialogAction
                      onClick={handleDeleteAccount}
                      disabled={isDeleting || !deletePassword}
                      className="bg-red-600 hover:bg-red-700"
                    >
                      {isDeleting ? "Deleting..." : "Delete Account"}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AccountSettings;
