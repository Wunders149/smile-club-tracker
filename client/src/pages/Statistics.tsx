import { Layout } from "@/components/Layout";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { PieChart as PieIcon, Users } from "lucide-react";

const COLORS = ['#3b82f6', '#f59e0b', '#10b981', '#ef4444', '#8b5cf6'];

export default function Statistics() {
  const { data: stats, isLoading } = useQuery({
    queryKey: ['/api/statistics'],
    queryFn: async () => {
      const res = await fetch('/api/statistics');
      if (!res.ok) throw new Error('Failed to fetch statistics');
      return res.json();
    }
  });

  if (isLoading) return <Layout><div className="text-center py-12">Loading...</div></Layout>;
  if (!stats) return <Layout><div className="text-center py-12">No data available</div></Layout>;

  return (
    <Layout>
      <div className="space-y-8 max-w-5xl">
        <div>
          <h1 className="text-4xl font-display font-bold text-foreground">Club Statistics</h1>
          <p className="text-muted-foreground mt-2">Overview of Smile Club demographics.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="rounded-2xl border-border/50 shadow-lg">
            <CardContent className="pt-6">
              <div className="text-center">
                <div className="text-4xl font-bold text-primary">{stats.totalVolunteers}</div>
                <p className="text-muted-foreground mt-2">Total Volunteers</p>
              </div>
            </CardContent>
          </Card>
          
          <Card className="rounded-2xl border-border/50 shadow-lg">
            <CardContent className="pt-6">
              <div className="text-center">
                <div className="text-4xl font-bold text-blue-600">{stats.maleCount}</div>
                <p className="text-muted-foreground mt-2">Male</p>
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-2xl border-border/50 shadow-lg">
            <CardContent className="pt-6">
              <div className="text-center">
                <div className="text-4xl font-bold text-pink-600">{stats.femaleCount}</div>
                <p className="text-muted-foreground mt-2">Female</p>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Gender Chart */}
          <Card className="rounded-2xl border-border/50 shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5" /> Gender Distribution
              </CardTitle>
            </CardHeader>
            <CardContent>
              {stats.genderBreakdown?.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie data={stats.genderBreakdown.map((g: any) => ({ name: g.gender || 'Unspecified', value: g.count }))} cx="50%" cy="50%" labelLine={false} label={({ name, value }) => `${name}: ${value}`} outerRadius={80} fill="#8884d8" dataKey="value">
                      {stats.genderBreakdown.map((_: any, i: number) => <Cell key={`cell-${i}`} fill={COLORS[i % COLORS.length]} />)}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              ) : <p className="text-muted-foreground">No data</p>}
            </CardContent>
          </Card>

          {/* Field of Study Chart */}
          <Card className="rounded-2xl border-border/50 shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <PieIcon className="w-5 h-5" /> Field of Study
              </CardTitle>
            </CardHeader>
            <CardContent>
              {stats.fieldStudyBreakdown?.length > 0 ? (
                <div className="space-y-3">
                  {stats.fieldStudyBreakdown.slice(0, 8).map((field: any, i: number) => (
                    <div key={i} className="flex items-center justify-between">
                      <span className="text-sm text-foreground">{field.field || 'Unspecified'}</span>
                      <div className="flex items-center gap-2">
                        <div className="w-24 bg-muted rounded-full h-2">
                          <div className="bg-primary h-full rounded-full" style={{ width: `${(field.count / stats.totalVolunteers * 100)}%` }}></div>
                        </div>
                        <span className="text-xs font-bold text-muted-foreground w-6 text-right">{field.count}</span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : <p className="text-muted-foreground">No data</p>}
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  );
}
