import { Layout } from "@/components/Layout";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart3, Users, PieChart as PieChartIcon, TrendingUp, CalendarDays } from "lucide-react";
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

  const genderData = stats.genderBreakdown.map((g: any) => ({
    name: g.gender || 'Unspecified',
    value: g.count
  }));

  const medicalData = stats.medicalBreakdown.map((m: any) => ({
    name: m.category,
    value: m.count
  }));

  return (
    <Layout>
      <div className="space-y-6 md:space-y-8 max-w-6xl mx-auto px-2 sm:px-0">
        <div className="text-center sm:text-left">
          <h1 className="text-2xl md:text-4xl font-display font-bold text-foreground">Club Analytics</h1>
          <p className="text-muted-foreground mt-2 text-sm md:text-lg">Insights into demographics and club commitment trends.</p>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
          <Card className="rounded-2xl border-border/50 shadow-lg bg-gradient-to-br from-card to-primary/5">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-3xl md:text-4xl font-bold text-primary">{stats.totalVolunteers}</div>
                  <p className="text-[10px] md:text-xs text-muted-foreground mt-1 font-bold uppercase tracking-wider">Volunteers</p>
                </div>
                <div className="bg-primary/10 p-2 md:p-3 rounded-xl text-primary shrink-0">
                  <Users className="w-5 h-5 md:w-6 md:h-6" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-2xl border-border/50 shadow-lg bg-gradient-to-br from-card to-orange-50/50">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-3xl md:text-4xl font-bold text-orange-600">{stats.totalEvents}</div>
                  <p className="text-[10px] md:text-xs text-muted-foreground mt-1 font-bold uppercase tracking-wider">Total Events</p>
                </div>
                <div className="bg-orange-500/10 p-2 md:p-3 rounded-xl text-orange-500 shrink-0">
                  <CalendarDays className="w-5 h-5 md:w-6 md:h-6" />
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="rounded-2xl border-border/50 shadow-lg bg-gradient-to-br from-card to-blue-50/30">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-3xl md:text-4xl font-bold text-blue-600">{stats.maleCount}</div>
                  <p className="text-[10px] md:text-xs text-muted-foreground mt-1 font-bold uppercase tracking-wider">Male</p>
                </div>
                <div className="bg-blue-500/10 p-2 md:p-3 rounded-xl text-blue-500 shrink-0">
                  <div className="w-5 h-5 md:w-6 md:h-6 font-black flex items-center justify-center">M</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-2xl border-border/50 shadow-lg bg-gradient-to-br from-card to-pink-50/30">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-3xl md:text-4xl font-bold text-pink-600">{stats.femaleCount}</div>
                  <p className="text-[10px] md:text-xs text-muted-foreground mt-1 font-bold uppercase tracking-wider">Female</p>
                </div>
                <div className="bg-pink-500/10 p-2 md:p-3 rounded-xl text-pink-500 shrink-0">
                  <div className="w-5 h-5 md:w-6 md:h-6 font-black flex items-center justify-center">F</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Commitment Trend */}
        <Card className="rounded-2xl border-border/50 shadow-lg overflow-hidden">
          <CardHeader className="bg-muted/30 px-4 md:px-6">
            <CardTitle className="flex items-center gap-2 text-base md:text-xl">
              <TrendingUp className="w-5 h-5 text-primary" /> Club Commitment
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6 px-2 sm:px-6">
            <div className="h-[250px] sm:h-[300px] w-full">
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
                      fontSize={10}
                      tickLine={false}
                      axisLine={false}
                    />
                    <YAxis 
                      fontSize={10}
                      tickLine={false}
                      axisLine={false}
                    />
                    <RechartsTooltip 
                      labelFormatter={(label) => format(new Date(label), 'MMMM d, yyyy')}
                      contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', fontSize: '12px' }}
                    />
                    <Area 
                      type="monotone" 
                      dataKey="points" 
                      stroke="hsl(var(--primary))" 
                      strokeWidth={2}
                      fillOpacity={1} 
                      fill="url(#colorPoints)" 
                    />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-full text-muted-foreground italic text-sm">
                  Not enough data to display trend
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-8">
          {/* Gender Pie Chart */}
          <Card className="rounded-2xl border-border/50 shadow-lg">
            <CardHeader className="px-4 md:px-6">
              <CardTitle className="flex items-center gap-2 text-base md:text-lg text-blue-500">
                <PieChartIcon className="w-5 h-5" /> Gender Distribution
              </CardTitle>
            </CardHeader>
            <CardContent className="p-2 sm:p-6">
              <div className="h-[250px] sm:h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={genderData}
                      cx="50%"
                      cy="50%"
                      innerRadius={window.innerWidth < 640 ? 40 : 60}
                      outerRadius={window.innerWidth < 640 ? 60 : 80}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {genderData.map((_entry: any, index: number) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <RechartsTooltip />
                    <Legend verticalAlign="bottom" height={36} wrapperStyle={{ fontSize: '12px' }}/>
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Medical vs Non-Medical Pie Chart */}
          <Card className="rounded-2xl border-border/50 shadow-lg">
            <CardHeader className="px-4 md:px-6">
              <CardTitle className="flex items-center gap-2 text-base md:text-lg text-red-500">
                <PieChartIcon className="w-5 h-5" /> Medical Classification
              </CardTitle>
            </CardHeader>
            <CardContent className="p-2 sm:p-6">
              <div className="h-[250px] sm:h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={medicalData}
                      cx="50%"
                      cy="50%"
                      innerRadius={window.innerWidth < 640 ? 40 : 60}
                      outerRadius={window.innerWidth < 640 ? 60 : 80}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      <Cell key="cell-0" fill="#ef4444" />
                      <Cell key="cell-1" fill="#3b82f6" />
                    </Pie>
                    <RechartsTooltip />
                    <Legend verticalAlign="bottom" height={36} wrapperStyle={{ fontSize: '12px' }}/>
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Field of Study Breakdown */}
          <Card className="rounded-2xl border-border/50 shadow-lg">
            <CardHeader className="px-4 md:px-6">
              <CardTitle className="flex items-center gap-2 text-base md:text-lg text-green-500">
                <PieChartIcon className="w-5 h-5" /> Field of Study
              </CardTitle>
            </CardHeader>
            <CardContent className="px-4 md:px-6 pb-6">
              <div className="space-y-4 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                {stats.fieldStudyBreakdown?.length > 0 ? (
                  [...stats.fieldStudyBreakdown]
                    .sort((a: any, b: any) => b.count - a.count)
                    .map((study: any, i: number) => (
                      <div key={i} className="flex items-center justify-between group">
                        <span className="text-xs md:text-sm text-muted-foreground font-medium truncate max-w-[120px] sm:max-w-[150px]" title={study.field || 'Unspecified'}>
                          {study.field || 'Unspecified'}
                        </span>
                        <div className="flex items-center gap-3">
                          <div className="w-20 sm:w-32 bg-muted rounded-full h-1.5 md:h-2 overflow-hidden">
                            <div 
                              className="bg-green-500/60 h-full rounded-full" 
                              style={{ width: `${(study.count / stats.totalVolunteers * 100)}%` }}
                            ></div>
                          </div>
                          <span className="font-bold text-foreground w-5 text-right text-xs md:text-sm">{study.count}</span>
                        </div>
                      </div>
                    ))
                ) : (
                  <p className="text-center py-12 text-muted-foreground italic text-sm">No data available</p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Event Type Breakdown */}
          <Card className="rounded-2xl border-border/50 shadow-lg">
            <CardHeader className="px-4 md:px-6">
              <CardTitle className="flex items-center gap-2 text-base md:text-lg text-orange-500">
                <Users className="w-5 h-5" /> Events by Type
              </CardTitle>
            </CardHeader>
            <CardContent className="px-4 md:px-6 pb-6">
              <div className="space-y-4 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                {stats.eventTypeBreakdown?.length > 0 ? (
                  stats.eventTypeBreakdown.map((item: any, i: number) => {
                    const totalEvents = stats.eventTypeBreakdown.reduce((sum: number, e: any) => sum + e.count, 0);
                    return (
                      <div key={i} className="flex items-center justify-between group">
                        <span className="text-xs md:text-sm text-muted-foreground font-medium">
                          {item.type}
                        </span>
                        <div className="flex items-center gap-3">
                          <div className="w-20 sm:w-32 bg-muted rounded-full h-1.5 md:h-2 overflow-hidden">
                            <div 
                              className="bg-orange-500/60 h-full rounded-full" 
                              style={{ width: `${(item.count / totalEvents * 100)}%` }}
                            ></div>
                          </div>
                          <span className="font-bold text-foreground w-5 text-right text-xs md:text-sm">{item.count}</span>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <p className="text-center py-12 text-muted-foreground italic text-sm">No events recorded</p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Position Breakdown */}
        <Card className="rounded-2xl border-border/50 shadow-lg overflow-hidden">
          <CardHeader className="bg-muted/30 px-4 md:px-6">
            <CardTitle className="flex items-center gap-2 text-base md:text-lg text-accent">
              <BarChart3 className="w-5 h-5" /> Organizational Breakdown
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 md:p-6 pb-8">
            {stats.positionBreakdown?.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-4">
                {stats.positionBreakdown.map((pos: any, i: number) => (
                  <div key={i} className="flex items-center justify-between group">
                    <span className="text-xs md:text-sm text-muted-foreground font-medium">{pos.position}</span>
                    <div className="flex items-center gap-3">
                      <div className="w-24 sm:w-32 bg-muted rounded-full h-1.5 md:h-2 overflow-hidden">
                        <div 
                          className="bg-primary/60 h-full rounded-full" 
                          style={{ width: `${(pos.count / stats.totalVolunteers * 100)}%` }}
                        ></div>
                      </div>
                      <span className="font-bold text-foreground w-5 text-right text-xs md:text-sm">{pos.count}</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : <p className="text-muted-foreground text-sm italic">No data</p>}
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
