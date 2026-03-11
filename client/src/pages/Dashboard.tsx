import { Layout } from "@/components/Layout";
import { useVolunteers, useVolunteerRankings } from "@/hooks/use-volunteers";
import { useEvents } from "@/hooks/use-events";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Calendar as CalendarIcon, Award, ArrowRight, Trophy } from "lucide-react";
import { format, isAfter } from "date-fns";
import { Link } from "wouter";
import { motion } from "framer-motion";

export default function Dashboard() {
  const { data: volunteers, isLoading: loadingVols } = useVolunteers();
  const { data: events, isLoading: loadingEvents } = useEvents();
  const { data: rankings, isLoading: loadingRankings } = useVolunteerRankings();

  const upComingEvents = events
    ? events.filter(e => isAfter(new Date(e.date), new Date())).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()).slice(0, 3)
    : [];

  const topVolunteers = rankings ? rankings.slice(0, 3) : [];

  const stats = [
    {
      title: "Total Volunteers",
      value: volunteers?.length || 0,
      icon: Users,
      color: "from-blue-500 to-indigo-500",
      bg: "bg-blue-500/10",
      text: "text-blue-600"
    },
    {
      title: "Total Events",
      value: events?.length || 0,
      icon: CalendarIcon,
      color: "from-primary to-orange-400",
      bg: "bg-primary/10",
      text: "text-primary"
    },
    {
      title: "Top Performer",
      value: topVolunteers[0]?.volunteer.fullName.split(' ')[0] || "N/A",
      icon: Award,
      color: "from-accent to-yellow-400",
      bg: "bg-accent/10",
      text: "text-accent-foreground"
    }
  ];

  return (
    <Layout>
      <div className="space-y-8 pb-8">
        <div>
          <h1 className="text-3xl md:text-4xl font-display font-bold text-foreground">Welcome back!</h1>
          <p className="text-muted-foreground mt-2 text-lg">Here's what's happening at Smile Club Mahajanga.</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {stats.map((stat, i) => {
            const Icon = stat.icon;
            return (
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                key={stat.title}
              >
                <Card className="border-border/50 shadow-lg shadow-black/5 hover:shadow-xl transition-all duration-300 rounded-2xl overflow-hidden relative group">
                  <div className={`absolute top-0 left-0 w-1 h-full bg-gradient-to-b ${stat.color}`} />
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-muted-foreground mb-1">{stat.title}</p>
                        <h3 className="text-3xl font-display font-bold text-foreground">{loadingVols ? "-" : stat.value}</h3>
                      </div>
                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${stat.bg} ${stat.text} group-hover:scale-110 transition-transform duration-300`}>
                        <Icon className="w-6 h-6" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Upcoming Events */}
          <Card className="border-border/50 shadow-lg shadow-black/5 rounded-2xl flex flex-col">
            <CardHeader className="border-b border-border/10 pb-4">
              <div className="flex items-center justify-between">
                <CardTitle className="text-xl flex items-center gap-2">
                  <CalendarIcon className="w-5 h-5 text-primary" />
                  Upcoming Events
                </CardTitle>
                <Link href="/events" className="text-sm text-primary hover:underline flex items-center gap-1 font-medium">
                  View All <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </CardHeader>
            <CardContent className="p-0 flex-1">
              {loadingEvents ? (
                <div className="p-6 text-center text-muted-foreground">Loading...</div>
              ) : upComingEvents.length === 0 ? (
                <div className="p-8 text-center flex flex-col items-center justify-center h-full">
                  <CalendarIcon className="w-12 h-12 text-muted mb-3" />
                  <p className="text-muted-foreground font-medium">No upcoming events</p>
                  <p className="text-sm text-muted-foreground/70 mt-1">Time to plan something new!</p>
                </div>
              ) : (
                <div className="divide-y divide-border/10">
                  {upComingEvents.map(event => (
                    <div key={event.id} className="p-4 sm:p-6 hover:bg-muted/30 transition-colors flex items-center gap-4">
                      <div className="bg-primary/10 rounded-xl p-3 text-center min-w-[70px]">
                        <p className="text-xs font-bold text-primary uppercase">{format(new Date(event.date), 'MMM')}</p>
                        <p className="text-xl font-display font-bold text-foreground">{format(new Date(event.date), 'dd')}</p>
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-bold text-foreground truncate text-lg">{event.name}</h4>
                        <p className="text-sm text-muted-foreground flex items-center gap-2">
                          <span className="inline-block w-2 h-2 rounded-full bg-accent"></span>
                          {event.type}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Top Rankings */}
          <Card className="border-border/50 shadow-lg shadow-black/5 rounded-2xl flex flex-col">
            <CardHeader className="border-b border-border/10 pb-4">
              <div className="flex items-center justify-between">
                <CardTitle className="text-xl flex items-center gap-2">
                  <Trophy className="w-5 h-5 text-accent" />
                  Top Volunteers
                </CardTitle>
                <Link href="/rankings" className="text-sm text-primary hover:underline flex items-center gap-1 font-medium">
                  Full Ranking <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </CardHeader>
            <CardContent className="p-0 flex-1">
              {loadingRankings ? (
                <div className="p-6 text-center text-muted-foreground">Loading...</div>
              ) : topVolunteers.length === 0 ? (
                <div className="p-8 text-center flex flex-col items-center justify-center h-full">
                  <Award className="w-12 h-12 text-muted mb-3" />
                  <p className="text-muted-foreground font-medium">No attendances recorded</p>
                </div>
              ) : (
                <div className="divide-y divide-border/10">
                  {topVolunteers.map((record, idx) => (
                    <div key={record.volunteer.id} className="p-4 sm:p-6 hover:bg-muted/30 transition-colors flex items-center gap-4">
                      <div className={`
                        w-10 h-10 rounded-full flex items-center justify-center font-display font-bold text-lg
                        ${idx === 0 ? 'bg-yellow-100 text-yellow-700 border-2 border-yellow-300' : 
                          idx === 1 ? 'bg-gray-200 text-gray-700 border-2 border-gray-300' : 
                          'bg-orange-100 text-orange-800 border-2 border-orange-300'}
                      `}>
                        {idx + 1}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-bold text-foreground truncate">{record.volunteer.fullName}</h4>
                        <p className="text-sm text-muted-foreground">{record.volunteer.position}</p>
                      </div>
                      <div className="bg-secondary/10 text-secondary-foreground font-bold px-3 py-1 rounded-full text-sm">
                        {record.totalPoints} pts
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  );
}
