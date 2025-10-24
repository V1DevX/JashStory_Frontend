import React, { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";
import api from "@/api";
import { Loader2, FileText, Book, Users, TrendingUp, UserPlus, CheckCircle, Clock } from "lucide-react";
import { toast } from "react-hot-toast";

const Dashboard = () => {
  const navigate = useNavigate();
  const [metrics, setMetrics] = useState({
    pageviews: "Loading...",
    monthlyUsers: "Loading...",
    newSignups: "Loading...",
    subscriptions: "Loading...",
    totalPosts: "Loading...",
    totalTests: "Loading...",
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchMetrics = async () => {
      setLoading(true);
      setError(null);
      try {
        const [
          pageviewsRes,
          usersRes,
          postsRes,
          testsRes,
        ] = await Promise.all([
          api.get("/metrics/pageviews").catch(e => ({ data: { value: "N/A" } })),
          api.get("/metrics/monthly-users").catch(e => ({ data: { value: "N/A" } })),
          api.get("/posts/count").catch(e => ({ data: { count: "N/A" } })),
          api.get("/tests/count").catch(e => ({ data: { count: "N/A" } })),
        ]);

        setMetrics({
          pageviews: pageviewsRes.data.value || "N/A",
          monthlyUsers: usersRes.data.value || "N/A",
          newSignups: "756", // Static for now
          subscriptions: "2.3K", // Static for now
          totalPosts: postsRes.data.count || "N/A",
          totalTests: testsRes.data.count || "N/A",
        });
      } catch (err) {
        console.error("Error fetching dashboard metrics:", err);
        setError("Failed to load dashboard metrics.");
        toast.error("Failed to load dashboard metrics.");
      } finally {
        setLoading(false);
      }
    };

    fetchMetrics();
  }, []);

  return (
    <div className="space-y-8 p-4">
      <h1 className="text-4xl font-extrabold text-foreground mb-6">Dashboard Overview</h1>

      {loading && (
        <div className="flex justify-center items-center h-64">
          <Loader2 className="w-12 h-12 animate-spin text-primary" />
          <span className="ml-4 text-xl text-muted-foreground">Loading metrics...</span>
        </div>
      )}

      {error && (
        <div className="text-destructive text-center text-lg mt-8">{error}</div>
      )}

      {!loading && !error && (
        <>
          {/* Top Metrics */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Pageviews</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{metrics.pageviews}</div>
                <p className="text-xs text-muted-foreground">+20.1% from last month</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Monthly Active Users</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{metrics.monthlyUsers}</div>
                <p className="text-xs text-muted-foreground">+180.1% from last month</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">New Signups</CardTitle>
                <UserPlus className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{metrics.newSignups}</div>
                <p className="text-xs text-muted-foreground">+19% from last month</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Subscriptions</CardTitle>
                <CheckCircle className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{metrics.subscriptions}</div>
                <p className="text-xs text-muted-foreground">+201 since last hour</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Posts</CardTitle>
                <Book className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{metrics.totalPosts}</div>
                <p className="text-xs text-muted-foreground">All time</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Tests</CardTitle>
                <FileText className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{metrics.totalTests}</div>
                <p className="text-xs text-muted-foreground">All time</p>
              </CardContent>
            </Card>
          </div>

          {/* Quick Actions */}
          <div className="flex flex-wrap justify-end gap-4 mt-8">
            <Button onClick={() => navigate("/admin/posts/create")} className="flex items-center gap-2">
              <Book className="w-5 h-5" />
              Create New Post
            </Button>
            <Button onClick={() => navigate("/admin/tests/create")} className="flex items-center gap-2">
              <FileText className="w-5 h-5" />
              Create New Test
            </Button>
            <Button onClick={() => navigate("/admin/users/create")} className="flex items-center gap-2">
              <UserPlus className="w-5 h-5" />
              Add New User
            </Button>
          </div>
        </>
      )}
    </div>
  );
};
export default Dashboard;
