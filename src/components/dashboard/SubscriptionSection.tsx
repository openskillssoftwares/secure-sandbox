import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { CreditCard, Calendar, CheckCircle, XCircle, DollarSign, Receipt, AlertCircle } from "lucide-react";

interface Subscription {
  id: string;
  tier: "free" | "basic" | "pro" | "enterprise";
  status: "active" | "cancelled" | "expired" | "suspended";
  start_date: string;
  end_date: string | null;
  auto_renew: boolean;
  payment_method: string | null;
}

interface PaymentHistory {
  id: string;
  amount: number;
  currency: string;
  payment_method: string;
  payment_status: "pending" | "completed" | "failed" | "refunded" | "cancelled";
  subscription_tier: string;
  created_at: string;
  receipt: string | null;
}

const SubscriptionSection = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [paymentHistory, setPaymentHistory] = useState<PaymentHistory[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCancelling, setIsCancelling] = useState(false);

  useEffect(() => {
    if (user) {
      fetchSubscription();
      fetchPaymentHistory();
    }
  }, [user]);

  const fetchSubscription = async () => {
    try {
      const { data, error } = await supabase
        .from("user_subscriptions")
        .select("*")
        .eq("user_id", user?.id)
        .single();

      if (error && error.code !== "PGRST116") throw error;
      setSubscription(data);
    } catch (error) {
      console.error("Error fetching subscription:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchPaymentHistory = async () => {
    try {
      const { data, error } = await supabase
        .from("payment_history")
        .select("*")
        .eq("user_id", user?.id)
        .order("created_at", { ascending: false })
        .limit(10);

      if (error) throw error;
      setPaymentHistory(data || []);
    } catch (error) {
      console.error("Error fetching payment history:", error);
    }
  };

  const handleCancelSubscription = async () => {
    if (!subscription || subscription.tier === "free") return;

    setIsCancelling(true);

    try {
      const { error } = await supabase
        .from("user_subscriptions")
        .update({
          auto_renew: false,
          status: "cancelled",
        })
        .eq("user_id", user?.id);

      if (error) throw error;

      await fetchSubscription();

      toast({
        title: "Subscription cancelled",
        description: "Your subscription will remain active until the end of the billing period",
      });
    } catch (error: any) {
      toast({
        title: "Cancellation failed",
        description: error.message || "Failed to cancel subscription",
        variant: "destructive",
      });
    } finally {
      setIsCancelling(false);
    }
  };

  const tierDetails = {
    free: {
      name: "Free",
      price: "$0",
      color: "bg-gray-400/10 text-gray-400 border-gray-400/20",
    },
    basic: {
      name: "Basic",
      price: "$9.99/mo",
      color: "bg-blue-400/10 text-blue-400 border-blue-400/20",
    },
    pro: {
      name: "Pro",
      price: "$19.99/mo",
      color: "bg-purple-400/10 text-purple-400 border-purple-400/20",
    },
    enterprise: {
      name: "Enterprise",
      price: "$49.99/mo",
      color: "bg-cyan-400/10 text-cyan-400 border-cyan-400/20",
    },
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      active: { label: "Active", color: "bg-green-400/10 text-green-400 border-green-400/20" },
      cancelled: { label: "Cancelled", color: "bg-yellow-400/10 text-yellow-400 border-yellow-400/20" },
      expired: { label: "Expired", color: "bg-red-400/10 text-red-400 border-red-400/20" },
      suspended: { label: "Suspended", color: "bg-orange-400/10 text-orange-400 border-orange-400/20" },
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.active;

    return (
      <Badge variant="outline" className={config.color}>
        {config.label}
      </Badge>
    );
  };

  const getPaymentStatusIcon = (status: string) => {
    switch (status) {
      case "completed":
        return <CheckCircle className="h-4 w-4 text-green-400" />;
      case "failed":
      case "cancelled":
        return <XCircle className="h-4 w-4 text-red-400" />;
      case "pending":
        return <AlertCircle className="h-4 w-4 text-yellow-400" />;
      default:
        return <Receipt className="h-4 w-4 text-muted-foreground" />;
    }
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
      {/* Current Subscription */}
      <Card className="card-cyber">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5 text-cyan-400" />
            Current Subscription
          </CardTitle>
          <CardDescription>Manage your subscription and billing</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {subscription ? (
            <>
              <div className="flex items-center justify-between p-6 bg-muted/30 rounded-lg">
                <div className="space-y-2">
                  <div className="flex items-center gap-3">
                    <Badge variant="outline" className={tierDetails[subscription.tier].color}>
                      {tierDetails[subscription.tier].name}
                    </Badge>
                    {getStatusBadge(subscription.status)}
                  </div>
                  <p className="text-3xl font-bold">{tierDetails[subscription.tier].price}</p>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Calendar className="h-4 w-4" />
                    <span>
                      Started {new Date(subscription.start_date).toLocaleDateString()}
                    </span>
                  </div>
                  {subscription.end_date && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Calendar className="h-4 w-4" />
                      <span>
                        Expires {new Date(subscription.end_date).toLocaleDateString()}
                      </span>
                    </div>
                  )}
                </div>
                <div className="text-right space-y-2">
                  {subscription.tier !== "free" && subscription.status === "active" && (
                    <>
                      <Button variant="cyber" disabled>
                        Upgrade Plan
                      </Button>
                      <Button
                        variant="cyber-outline"
                        onClick={handleCancelSubscription}
                        disabled={isCancelling}
                      >
                        {isCancelling ? "Cancelling..." : "Cancel Subscription"}
                      </Button>
                    </>
                  )}
                  {subscription.tier === "free" && (
                    <Button variant="cyber" disabled>
                      Upgrade to Pro
                    </Button>
                  )}
                </div>
              </div>

              {subscription.tier !== "free" && (
                <div className="space-y-3">
                  <h4 className="font-medium flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-400" />
                    Included Features
                  </h4>
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    <li className="flex items-center gap-2">
                      <div className="h-1 w-1 rounded-full bg-cyan-400" />
                      Unlimited lab access
                    </li>
                    <li className="flex items-center gap-2">
                      <div className="h-1 w-1 rounded-full bg-cyan-400" />
                      Priority support
                    </li>
                    <li className="flex items-center gap-2">
                      <div className="h-1 w-1 rounded-full bg-cyan-400" />
                      Exclusive content
                    </li>
                    {subscription.tier === "pro" && (
                      <>
                        <li className="flex items-center gap-2">
                          <div className="h-1 w-1 rounded-full bg-cyan-400" />
                          Custom lab environments
                        </li>
                        <li className="flex items-center gap-2">
                          <div className="h-1 w-1 rounded-full bg-cyan-400" />
                          Advanced analytics
                        </li>
                      </>
                    )}
                  </ul>
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-8">
              <CreditCard className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No active subscription</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Payment Method */}
      <Card className="card-cyber">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5 text-cyan-400" />
            Payment Method
          </CardTitle>
          <CardDescription>Manage your payment methods</CardDescription>
        </CardHeader>
        <CardContent>
          {subscription?.payment_method ? (
            <div className="flex items-center justify-between p-4 bg-muted/30 rounded-lg">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-cyan-400/10 rounded">
                  <CreditCard className="h-5 w-5 text-cyan-400" />
                </div>
                <div>
                  <p className="font-medium">{subscription.payment_method}</p>
                  <p className="text-sm text-muted-foreground">Primary payment method</p>
                </div>
              </div>
              <Button variant="cyber-outline" disabled>
                Update
              </Button>
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-muted-foreground mb-4">No payment method added</p>
              <Button variant="cyber" disabled>
                Add Payment Method
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Payment History */}
      <Card className="card-cyber">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Receipt className="h-5 w-5 text-cyan-400" />
            Payment History
          </CardTitle>
          <CardDescription>View your past transactions</CardDescription>
        </CardHeader>
        <CardContent>
          {paymentHistory.length === 0 ? (
            <div className="text-center py-8">
              <Receipt className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No payment history</p>
            </div>
          ) : (
            <div className="space-y-3">
              {paymentHistory.map((payment) => (
                <div
                  key={payment.id}
                  className="flex items-center justify-between p-4 bg-muted/30 rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    {getPaymentStatusIcon(payment.payment_status)}
                    <div>
                      <p className="font-medium">
                        {payment.currency} ${payment.amount.toFixed(2)}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {payment.subscription_tier} plan • {payment.payment_method}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium capitalize">{payment.payment_status}</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(payment.created_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default SubscriptionSection;
