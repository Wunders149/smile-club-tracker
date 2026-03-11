import { Layout } from "@/components/Layout";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart3, Users } from "lucide-react";

export default function Statistics() {
  const { data: stats, isLoading } = useQuery({
    queryKey: ['/api/statistics'],
    queryFn: async () => {
      const res = await fetch('/api/statistics');
      if (!res.ok) throw new Error('Failed to fetch statistics');
      return res.json();
    }
  });

  if (isLoading) return <Layout><div className="text-center py-12">Loading statistics...</div></Layout>;
  if (!stats) return <Layout><div className="text-center py-12">No data available</div></Layout>;

  return (
    <Layout>
      <div className="space-y-8 max-w-5xl">
        <div>
          <h1 className="text-4xl font-display font-bold text-foreground">Club Statistics</h1>
          <p className="text-muted-foreground mt-2">Overview of Smile Club Mahajanga demographics and organization.</p>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="rounded-2xl border-border/50 shadow-lg">
            <CardContent className="pt-6">
              <div className="text-center">
                <div className="text-5xl font-bold text-primary">{stats.totalVolunteers}</div>
                <p className="text-muted-foreground mt-2">Total Volunteers</p>
              </div>
            </CardContent>
          </Card>
          
          <Card className="rounded-2xl border-border/50 shadow-lg">
            <CardContent className="pt-6">
              <div className="text-center">
                <div className="text-5xl font-bold text-blue-600">{stats.maleCount}</div>
                <p className="text-muted-foreground mt-2">Male</p>
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-2xl border-border/50 shadow-lg">
            <CardContent className="pt-6">
              <div className="text-center">
                <div className="text-5xl font-bold text-pink-600">{stats.femaleCount}</div>
                <p className="text-muted-foreground mt-2">Female</p>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Gender Distribution */}
          <Card className="rounded-2xl border-border/50 shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5" /> Gender Distribution
              </CardTitle>
            </CardHeader>
            <CardContent>
              {stats.genderBreakdown?.length > 0 ? (
                <div className="space-y-4">
                  {stats.genderBreakdown.map((g: any, i: number) => (
                    <div key={i} className="flex items-center justify-between">
                      <span className="text-sm font-medium text-foreground">{g.gender || 'Unspecified'}</span>
                      <div className="flex items-center gap-3">
                        <div className="w-32 bg-muted rounded-full h-2">
                          <div 
                            className={`h-full rounded-full ${g.gender === 'Male' ? 'bg-blue-500' : g.gender === 'Female' ? 'bg-pink-500' : 'bg-gray-400'}`} 
                            style={{ width: `${(g.count / stats.totalVolunteers * 100)}%` }}
                          ></div>
                        </div>
                        <span className="font-bold text-muted-foreground w-8 text-right">{g.count}</span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : <p className="text-muted-foreground">No data</p>}
            </CardContent>
          </Card>

          {/* Position Distribution */}
          <Card className="rounded-2xl border-border/50 shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="w-5 h-5" /> Position Distribution
              </CardTitle>
            </CardHeader>
            <CardContent>
              {stats.positionBreakdown?.length > 0 ? (
                <div className="space-y-3">
                  {stats.positionBreakdown.slice(0, 8).map((pos: any, i: number) => (
                    <div key={i} className="flex items-center justify-between">
                      <span className="text-sm text-foreground font-medium">{pos.position}</span>
                      <div className="flex items-center gap-3">
                        <div className="w-24 bg-muted rounded-full h-2">
                          <div 
                            className="bg-accent h-full rounded-full" 
                            style={{ width: `${(pos.count / stats.totalVolunteers * 100)}%` }}
                          ></div>
                        </div>
                        <span className="font-bold text-muted-foreground w-6 text-right">{pos.count}</span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : <p className="text-muted-foreground">No data</p>}
            </CardContent>
          </Card>
        </div>

        {/* Field of Study */}
        <Card className="rounded-2xl border-border/50 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5" /> Field of Study Distribution
            </CardTitle>
          </CardHeader>
          <CardContent>
            {stats.fieldStudyBreakdown?.length > 0 ? (
              <div className="space-y-3">
                {stats.fieldStudyBreakdown.slice(0, 8).map((field: any, i: number) => (
                  <div key={i} className="flex items-center justify-between">
                    <span className="text-sm text-foreground font-medium">{field.field || 'Unspecified'}</span>
                    <div className="flex items-center gap-3">
                      <div className="w-32 bg-muted rounded-full h-2">
                        <div 
                          className="bg-primary h-full rounded-full" 
                          style={{ width: `${(field.count / stats.totalVolunteers * 100)}%` }}
                        ></div>
                      </div>
                      <span className="font-bold text-muted-foreground w-8 text-right">{field.count}</span>
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
