import { apiRequest } from "@/api/apiClient";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import {
  ArrowUpRight,
  CheckCircle2,
  Clock,
  FileText,
  LayoutDashboard,
  Plus,
} from "lucide-react";
import { useContext, useEffect, useState } from "react";
import { useNavigate } from "react-router";

import BlurFade from "@/components/animations/BlurFade";

import NumberTicker from "@/components/animations/NumberTicker.jsx";
import { AuthContext } from "@/context/AuthContextInstance";

const Dashboard = () => {
  useContext(AuthContext);
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    totalTasks: 0,
    pendingTasks: 0,
    completedTasks: 0,
  });

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const data = await apiRequest({ endpoint: "/tasks" });
        const total = data.length || 0;
        const pending = data.filter((t) => t.status === "pending").length || 0;
        const completed =
          data.filter((t) => t.status === "completed").length || 0;
        setStats({
          totalTasks: total,
          pendingTasks: pending,
          completedTasks: completed,
        });
      } catch (err) {
        console.error("Error fetching dashboard stats:", err);
      }
    };
    fetchStats();
  }, []);

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 lg:gap-6">
        <BlurFade delay={100}>
          <Card className="border-border bg-card/50 backdrop-blur-sm">
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-widest">
                Total Tasks
              </CardTitle>
              <LayoutDashboard className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold tracking-tighter">
                <NumberTicker value={stats.totalTasks} />
              </div>
              <div className="mt-4">
                <Progress value={100} className="h-1" />
              </div>
            </CardContent>
          </Card>
        </BlurFade>

        <BlurFade delay={200}>
          <Card className="border-border bg-card/50 backdrop-blur-sm">
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-widest">
                Pending Action
              </CardTitle>
              <Clock className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold tracking-tighter text-primary">
                <NumberTicker value={stats.pendingTasks} />
              </div>
              <div className="mt-4">
                <Progress
                  value={(stats.pendingTasks / (stats.totalTasks || 1)) * 100}
                  className="h-1"
                />
              </div>
            </CardContent>
          </Card>
        </BlurFade>

        <BlurFade delay={300}>
          <Card className="border-border bg-card/50 backdrop-blur-sm">
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-widest">
                Completed
              </CardTitle>
              <CheckCircle2 className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold tracking-tighter text-green-500">
                <NumberTicker value={stats.completedTasks} />
              </div>
              <div className="mt-4">
                <Progress
                  value={(stats.completedTasks / (stats.totalTasks || 1)) * 100}
                  className="h-1 bg-green-500/20"
                />
              </div>
            </CardContent>
          </Card>
        </BlurFade>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <BlurFade delay={400}>
          <Card className="border-border bg-card/50 backdrop-blur-sm overflow-hidden">
            <CardHeader>
              <CardTitle className="text-lg font-semibold">
                Quick Actions
              </CardTitle>
              <CardDescription>
                Manage your workflow effectively
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-wrap gap-4">
              <Button className="flex items-center gap-2 group cursor-pointer">
                <Plus size={16} />
                Create New Task
                <ArrowUpRight
                  size={14}
                  className="transition-transform group-hover:translate-x-1 group-hover:-translate-y-1"
                />
              </Button>
              <Button
                variant="outline"
                className="flex items-center gap-2 group cursor-pointer"
                onClick={() => navigate('/tasks')}
              >
                <FileText size={16} />
                View All Tasks
                <ArrowUpRight
                  size={14}
                  className="transition-transform group-hover:translate-x-1 group-hover:-translate-y-1"
                />
              </Button>
            </CardContent>
          </Card>
        </BlurFade>
      </div>
    </div>
  );
};

export default Dashboard;
