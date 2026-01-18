import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Trophy, Target, Clock, Award, TrendingUp, Star } from "lucide-react";

interface LabProgress {
  id: string;
  lab_id: string;
  lab_name: string;
  status: "not_started" | "in_progress" | "completed";
  score: number;
  time_spent_seconds: number;
  attempts: number;
  completed_at: string | null;
}

interface LeaderboardEntry {
  user_id: string;
  username: string;
  avatar_url: string | null;
  labs_completed: number;
  total_score: number;
  rank: number;
}

const LabProgressSection = () => {
  const { user } = useAuth();
  const [labProgress, setLabProgress] = useState<LabProgress[]>([]);
  const [userRank, setUserRank] = useState<LeaderboardEntry | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchLabProgress();
      fetchUserRank();
    }
  }, [user]);

  const fetchLabProgress = async () => {
    try {
      const { data, error } = await supabase
        .from("lab_progress")
        .select("*")
        .eq("user_id", user?.id)
        .order("updated_at", { ascending: false });

      if (error) throw error;
      setLabProgress(data || []);
    } catch (error) {
      console.error("Error fetching lab progress:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchUserRank = async () => {
    try {
      const { data, error } = await supabase
        .from("leaderboard_global")
        .select("*")
        .eq("user_id", user?.id)
        .single();

      if (error && error.code !== "PGRST116") throw error;
      setUserRank(data);
    } catch (error) {
      console.error("Error fetching user rank:", error);
    }
  };

  const totalLabs = labProgress.length;
  const completedLabs = labProgress.filter((lab) => lab.status === "completed").length;
  const inProgressLabs = labProgress.filter((lab) => lab.status === "in_progress").length;
  const totalScore = labProgress.reduce((sum, lab) => sum + lab.score, 0);
  const completionRate = totalLabs > 0 ? (completedLabs / totalLabs) * 100 : 0;

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m`;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cyan-400" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Overview */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="card-cyber">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-cyan-400/10 rounded-lg">
                <Trophy className="h-6 w-6 text-cyan-400" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Score</p>
                <p className="text-2xl font-bold">{totalScore}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="card-cyber">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-green-400/10 rounded-lg">
                <Target className="h-6 w-6 text-green-400" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Completed</p>
                <p className="text-2xl font-bold">{completedLabs}/{totalLabs}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="card-cyber">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-yellow-400/10 rounded-lg">
                <Clock className="h-6 w-6 text-yellow-400" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">In Progress</p>
                <p className="text-2xl font-bold">{inProgressLabs}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="card-cyber">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-purple-400/10 rounded-lg">
                <Award className="h-6 w-6 text-purple-400" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Global Rank</p>
                <p className="text-2xl font-bold">#{userRank?.rank || "N/A"}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Progress Overview */}
      <Card className="card-cyber">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-cyan-400" />
            Overall Progress
          </CardTitle>
          <CardDescription>Your completion rate across all labs</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <div className="flex justify-between mb-2">
              <span className="text-sm font-medium">Completion Rate</span>
              <span className="text-sm text-muted-foreground">{completionRate.toFixed(1)}%</span>
            </div>
            <Progress value={completionRate} className="h-3" />
          </div>
          
          {userRank && (
            <div className="grid grid-cols-3 gap-4 pt-4 border-t border-border/50">
              <div className="text-center">
                <p className="text-2xl font-bold text-cyan-400">{userRank.labs_completed}</p>
                <p className="text-xs text-muted-foreground">Labs Completed</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-green-400">{userRank.total_score}</p>
                <p className="text-xs text-muted-foreground">Total Points</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-purple-400">#{userRank.rank}</p>
                <p className="text-xs text-muted-foreground">Global Rank</p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Lab Progress List */}
      <Card className="card-cyber">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Star className="h-5 w-5 text-cyan-400" />
            Your Labs
          </CardTitle>
          <CardDescription>Detailed progress on all labs</CardDescription>
        </CardHeader>
        <CardContent>
          {labProgress.length === 0 ? (
            <div className="text-center py-12">
              <Trophy className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground mb-2">No labs started yet</p>
              <p className="text-sm text-muted-foreground">
                Head over to the Labs page to start your hacking journey!
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {labProgress.map((lab) => (
                <div
                  key={lab.id}
                  className="flex items-center justify-between p-4 bg-muted/30 rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h4 className="font-medium">{lab.lab_name}</h4>
                      <Badge
                        variant={
                          lab.status === "completed"
                            ? "default"
                            : lab.status === "in_progress"
                            ? "secondary"
                            : "outline"
                        }
                        className={
                          lab.status === "completed"
                            ? "bg-green-400/10 text-green-400 border-green-400/20"
                            : lab.status === "in_progress"
                            ? "bg-yellow-400/10 text-yellow-400 border-yellow-400/20"
                            : ""
                        }
                      >
                        {lab.status === "completed"
                          ? "Completed"
                          : lab.status === "in_progress"
                          ? "In Progress"
                          : "Not Started"}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Trophy className="h-3 w-3" />
                        {lab.score} points
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {formatTime(lab.time_spent_seconds)}
                      </span>
                      <span className="flex items-center gap-1">
                        <Target className="h-3 w-3" />
                        {lab.attempts} attempts
                      </span>
                    </div>
                  </div>
                  {lab.completed_at && (
                    <div className="text-right text-sm text-muted-foreground">
                      <p>Completed</p>
                      <p>{new Date(lab.completed_at).toLocaleDateString()}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default LabProgressSection;
