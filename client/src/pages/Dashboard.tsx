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
      <div className="space-y-6 md:space-y-8 pb-8">
        <div className="text-center sm:text-left">
          <h1 className="text-2xl md:text-4xl font-display font-bold text-foreground leading-tight">Welcome back!</h1>
          <p className="text-muted-foreground mt-2 text-base md:text-lg">Here's what's happening at Smile Club Mahajanga.</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
          {stats.map((stat, i) => {
            const Icon = stat.icon;
            return (
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                key={stat.title}
                className={i === 2 ? "sm:col-span-2 lg:col-span-1" : ""}
              >
                <Card className="border-border/50 shadow-lg shadow-black/5 hover:shadow-xl transition-all duration-300 rounded-2xl overflow-hidden relative group h-full">
                  <div className={`absolute top-0 left-0 w-1 h-full bg-gradient-to-b ${stat.color}`} />
                  <CardContent className="p-5 md:p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs md:text-sm font-bold text-muted-foreground mb-1 uppercase tracking-wider">{stat.title}</p>
                        <h3 className="text-2xl md:text-3xl font-display font-bold text-foreground">{loadingVols ? "-" : stat.value}</h3>
                      </div>
                      <div className={`w-10 h-10 md:w-12 md:h-12 rounded-xl flex items-center justify-center ${stat.bg} ${stat.text} group-hover:scale-110 transition-transform duration-300 shrink-0`}>
                        <Icon className="w-5 h-5 md:w-6 md:h-6" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-8">
          {/* Upcoming Events */}
          <Card className="border-border/50 shadow-lg shadow-black/5 rounded-2xl flex flex-col overflow-hidden">
            <CardHeader className="border-b border-border/10 pb-4 px-5 md:px-6">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg md:text-xl flex items-center gap-2">
                  <CalendarIcon className="w-5 h-5 text-primary" />
                  Upcoming Events
                </CardTitle>
                <Link href="/events" className="text-xs md:text-sm text-primary hover:underline flex items-center gap-1 font-bold uppercase tracking-wider">
                  View All <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </CardHeader>
            <CardContent className="p-0 flex-1">
              {loadingEvents ? (
                <div className="p-12 text-center text-muted-foreground italic">Loading...</div>
              ) : upComingEvents.length === 0 ? (
                <div className="p-12 text-center flex flex-col items-center justify-center h-full">
                  <CalendarIcon className="w-12 h-12 text-muted mb-3 opacity-20" />
                  <p className="text-muted-foreground font-medium">No upcoming events</p>
                </div>
              ) : (
                <div className="divide-y divide-border/10">
                  {upComingEvents.map(event => (
                    <div key={event.id} className="p-4 sm:p-6 hover:bg-muted/30 transition-colors flex items-center gap-4">
                      <div className="bg-primary/10 rounded-xl p-2 sm:p-3 text-center min-w-[60px] sm:min-w-[70px] shrink-0 border border-primary/5">
                        <p className="text-[10px] sm:text-xs font-bold text-primary uppercase">{format(new Date(event.date), 'MMM')}</p>
                        <p className="text-lg sm:text-xl font-display font-bold text-foreground leading-none mt-0.5">{format(new Date(event.date), 'dd')}</p>
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-bold text-foreground truncate text-base sm:text-lg">{event.name}</h4>
                        <p className="text-xs sm:text-sm text-muted-foreground flex items-center gap-2 mt-0.5">
                          <span className="inline-block w-1.5 h-1.5 rounded-full bg-accent animate-pulse"></span>
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
          <Card className="border-border/50 shadow-lg shadow-black/5 rounded-2xl flex flex-col overflow-hidden">
            <CardHeader className="border-b border-border/10 pb-4 px-5 md:px-6">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg md:text-xl flex items-center gap-2">
                  <Trophy className="w-5 h-5 text-accent" />
                  Top Volunteers
                </CardTitle>
                <Link href="/rankings" className="text-xs md:text-sm text-primary hover:underline flex items-center gap-1 font-bold uppercase tracking-wider">
                  Full List <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </CardHeader>
            <CardContent className="p-0 flex-1">
              {loadingRankings ? (
                <div className="p-12 text-center text-muted-foreground italic">Loading...</div>
              ) : topVolunteers.length === 0 ? (
                <div className="p-12 text-center flex flex-col items-center justify-center h-full">
                  <Award className="w-12 h-12 text-muted mb-3 opacity-20" />
                  <p className="text-muted-foreground font-medium">No records yet</p>
                </div>
              ) : (
                <div className="divide-y divide-border/10">
                  {topVolunteers.map((record, idx) => (
                    <div key={record.volunteer.id} className="p-4 sm:p-6 hover:bg-muted/30 transition-colors flex items-center gap-4">
                      <div className={`
                        w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center font-display font-bold text-sm sm:text-lg shrink-0 border-2
                        ${idx === 0 ? 'bg-yellow-100 text-yellow-700 border-yellow-300' : 
                          idx === 1 ? 'bg-slate-100 text-slate-700 border-slate-300' : 
                          'bg-orange-100 text-orange-800 border-orange-300'}
                      `}>
                        {idx + 1}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-bold text-foreground truncate text-base sm:text-lg">{record.volunteer.fullName}</h4>
                        <p className="text-xs sm:text-sm text-muted-foreground truncate">{record.volunteer.position}</p>
                      </div>
                      <div className="bg-secondary/10 text-secondary-foreground font-bold px-2 sm:px-3 py-1 rounded-full text-xs sm:text-sm shrink-0 border border-secondary/5">
                        {record.totalPoints} <span className="text-[10px] hidden sm:inline">pts</span>
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
