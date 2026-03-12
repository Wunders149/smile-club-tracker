import { Layout } from "@/components/Layout";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart3, Users, PieChart as PieChartIcon, TrendingUp } from "lucide-react";
import { 
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip, 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Legend
} from "recharts";
import { format } from "date-fns";

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];

export default function Statistics() {
  const { data: stats, isLoading } = useQuery({
    queryKey: ['/api/statistics'],
    queryFn: async () => {
      const res = await fetch('/api/statistics');
      if (!res.ok) throw new Error('Failed to fetch statistics');
      return res.json();
    },
    refetchInterval: 30000,
  });

  if (isLoading) return <Layout><div className="text-center py-12">Loading statistics...</div></Layout>;
  if (!stats) return <Layout><div className="text-center py-12">No data available</div></Layout>;

  // Prepare Pie Chart data
  const genderData = stats.genderBreakdown.map((g: any) => ({
    name: g.gender || 'Unspecified',
    value: g.count
  }));

  const studyData = stats.fieldStudyBreakdown.map((f: any) => ({
    name: f.field || 'Unspecified',
    value: f.count
  }));

  return (
    <Layout>
      <div className="space-y-8 max-w-6xl mx-auto">
        <div>
          <h1 className="text-4xl font-display font-bold text-foreground">Club Analytics</h1>
          <p className="text-muted-foreground mt-2">Insights into demographics and club commitment trends.</p>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="rounded-2xl border-border/50 shadow-lg bg-gradient-to-br from-card to-secondary/5">
            <CardContent className="pt-6">
              <div className="text-center">
                <div className="text-5xl font-bold text-primary">{stats.totalVolunteers}</div>
                <p className="text-muted-foreground mt-2 font-medium">Total Active Volunteers</p>
              </div>
            </CardContent>
          </Card>
          
          <Card className="rounded-2xl border-border/50 shadow-lg bg-gradient-to-br from-card to-blue-50/30">
            <CardContent className="pt-6">
              <div className="text-center">
                <div className="text-5xl font-bold text-blue-600">{stats.maleCount}</div>
                <p className="text-muted-foreground mt-2 font-medium text-blue-600/80">Male</p>
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-2xl border-border/50 shadow-lg bg-gradient-to-br from-card to-pink-50/30">
            <CardContent className="pt-6">
              <div className="text-center">
                <div className="text-5xl font-bold text-pink-600">{stats.femaleCount}</div>
                <p className="text-muted-foreground mt-2 font-medium text-pink-600/80">Female</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Commitment Trend */}
        <Card className="rounded-2xl border-border/50 shadow-lg overflow-hidden">
          <CardHeader className="bg-muted/30">
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-primary" /> Global Club Commitment (Attendance Points)
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="h-[300px] w-full">
              {stats.commitmentTrend?.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={stats.commitmentTrend}>
                    <defs>
                      <linearGradient id="colorPoints" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#88888822" />
                    <XAxis 
                      dataKey="date" 
                      tickFormatter={(str) => format(new Date(str), 'MMM d')}
                      fontSize={12}
                      tickLine={false}
                      axisLine={false}
                    />
                    <YAxis 
                      fontSize={12}
                      tickLine={false}
                      axisLine={false}
                    />
                    <RechartsTooltip 
                      labelFormatter={(label) => format(new Date(label), 'MMMM d, yyyy')}
                      contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                    />
                    <Area 
                      type="monotone" 
                      dataKey="points" 
                      stroke="hsl(var(--primary))" 
                      strokeWidth={3}
                      fillOpacity={1} 
                      fill="url(#colorPoints)" 
                    />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-full text-muted-foreground italic">
                  Not enough data to display trend
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Gender Pie Chart */}
          <Card className="rounded-2xl border-border/50 shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <PieChartIcon className="w-5 h-5 text-blue-500" /> Gender Distribution
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={genderData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {genderData.map((_entry: any, index: number) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <RechartsTooltip />
                    <Legend verticalAlign="bottom" height={36}/>
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Field of Study Breakdown */}
          <Card className="rounded-2xl border-border/50 shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <PieChartIcon className="w-5 h-5 text-green-500" /> Field of Study
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                {stats.fieldStudyBreakdown?.length > 0 ? (
                  [...stats.fieldStudyBreakdown]
                    .sort((a: any, b: any) => b.count - a.count)
                    .map((study: any, i: number) => (
                      <div key={i} className="flex items-center justify-between group">
                        <span className="text-sm text-muted-foreground font-medium truncate max-w-[150px] group-hover:text-foreground transition-colors" title={study.field || 'Unspecified'}>
                          {study.field || 'Unspecified'}
                        </span>
                        <div className="flex items-center gap-3">
                          <div className="w-24 sm:w-32 bg-muted rounded-full h-2 overflow-hidden">
                            <div 
                              className="bg-green-500/60 h-full rounded-full transition-all duration-500 group-hover:bg-green-500" 
                              style={{ width: `${(study.count / stats.totalVolunteers * 100)}%` }}
                            ></div>
                          </div>
                          <span className="font-bold text-foreground w-6 text-right text-sm">{study.count}</span>
                        </div>
                      </div>
                    ))
                ) : (
                  <p className="text-center py-12 text-muted-foreground italic">No data available</p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Event Type Breakdown */}
          <Card className="rounded-2xl border-border/50 shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Users className="w-5 h-5 text-orange-500" /> Events by Type
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                {stats.eventTypeBreakdown?.length > 0 ? (
                  stats.eventTypeBreakdown.map((item: any, i: number) => {
                    const totalEvents = stats.eventTypeBreakdown.reduce((sum: number, e: any) => sum + e.count, 0);
                    return (
                      <div key={i} className="flex items-center justify-between group">
                        <span className="text-sm text-muted-foreground font-medium group-hover:text-foreground transition-colors">
                          {item.type}
                        </span>
                        <div className="flex items-center gap-3">
                          <div className="w-24 sm:w-32 bg-muted rounded-full h-2 overflow-hidden">
                            <div 
                              className="bg-orange-500/60 h-full rounded-full transition-all duration-500 group-hover:bg-orange-500" 
                              style={{ width: `${(item.count / totalEvents * 100)}%` }}
                            ></div>
                          </div>
                          <span className="font-bold text-foreground w-6 text-right text-sm">{item.count}</span>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <p className="text-center py-12 text-muted-foreground italic">No events recorded</p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Position Breakdown remains as bars because it can be many items */}
        <Card className="rounded-2xl border-border/50 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <BarChart3 className="w-5 h-5 text-accent" /> Organizational Breakdown
            </CardTitle>
          </CardHeader>
          <CardContent>
            {stats.positionBreakdown?.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-4">
                {stats.positionBreakdown.map((pos: any, i: number) => (
                  <div key={i} className="flex items-center justify-between group">
                    <span className="text-sm text-muted-foreground font-medium group-hover:text-foreground transition-colors">{pos.position}</span>
                    <div className="flex items-center gap-3">
                      <div className="w-32 bg-muted rounded-full h-2 overflow-hidden">
                        <div 
                          className="bg-primary/60 h-full rounded-full transition-all duration-500 group-hover:bg-primary" 
                          style={{ width: `${(pos.count / stats.totalVolunteers * 100)}%` }}
                        ></div>
                      </div>
                      <span className="font-bold text-foreground w-6 text-right">{pos.count}</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : <p className="text-muted-foreground">No data</p>}
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
