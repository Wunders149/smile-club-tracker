import { Layout } from "@/components/Layout";
import { useVolunteerRankings } from "@/hooks/use-volunteers";
import { Card, CardContent } from "@/components/ui/card";
import { Trophy, Medal, Star } from "lucide-react";
import { motion } from "framer-motion";

export default function Rankings() {
  const { data: rankings, isLoading } = useVolunteerRankings();

  return (
    <Layout>
      <div className="space-y-8 max-w-4xl mx-auto">
        <div className="text-center py-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-accent/20 text-accent mb-4">
            <Trophy className="w-8 h-8" />
          </div>
          <h1 className="text-4xl font-display font-bold text-foreground">Volunteer Rankings</h1>
          <p className="text-muted-foreground mt-3 text-lg">Celebrating the dedication of our amazing Smile Club members.</p>
        </div>

        {isLoading ? (
          <div className="text-center py-12 text-muted-foreground">Loading rankings...</div>
        ) : !rankings?.length ? (
          <div className="text-center py-16 bg-card rounded-3xl border border-border/50">
            <Star className="w-12 h-12 text-muted mx-auto mb-3" />
            <p className="font-medium text-lg">No attendances recorded yet</p>
          </div>
        ) : (
          <div className="space-y-4">
            {rankings.map((record, index) => {
              const { volunteer, attendanceCount } = record;
              
              // Top 3 styling logic
              const isFirst = index === 0;
              const isSecond = index === 1;
              const isThird = index === 2;
              
              let cardStyle = "bg-card hover:border-border transition-all";
              let badgeStyle = "bg-muted text-muted-foreground border-border";
              
              if (isFirst) {
                cardStyle = "bg-gradient-to-r from-yellow-500/10 to-transparent border-yellow-500/30 scale-[1.02] shadow-xl shadow-yellow-500/10 z-10 relative";
                badgeStyle = "bg-yellow-100 text-yellow-700 border-yellow-400";
              } else if (isSecond) {
                cardStyle = "bg-gradient-to-r from-slate-300/20 to-transparent border-slate-300/50";
                badgeStyle = "bg-slate-100 text-slate-700 border-slate-300";
              } else if (isThird) {
                cardStyle = "bg-gradient-to-r from-orange-500/10 to-transparent border-orange-500/30";
                badgeStyle = "bg-orange-100 text-orange-800 border-orange-300";
              }

              return (
                <motion.div 
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  key={volunteer.id}
                >
                  <Card className={`border rounded-2xl overflow-hidden ${cardStyle}`}>
                    <CardContent className="p-4 sm:p-6 flex items-center gap-4">
                      {/* Rank Number/Icon */}
                      <div className={`
                        w-12 h-12 rounded-2xl flex items-center justify-center font-display font-bold text-xl border-2 shrink-0
                        ${badgeStyle}
                      `}>
                        {isFirst ? <Medal className="w-6 h-6" /> : `#${index + 1}`}
                      </div>
                      
                      {/* Info */}
                      <div className="flex-1 min-w-0 flex items-center gap-4">
                        <div className="w-12 h-12 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold overflow-hidden shrink-0 hidden sm:flex">
                           {volunteer.photo ? <img src={volunteer.photo} alt={volunteer.fullName} className="w-full h-full object-cover" /> : volunteer.fullName.charAt(0)}
                        </div>
                        <div>
                          <h3 className="font-bold text-lg text-foreground truncate">{volunteer.fullName}</h3>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground mt-0.5">
                            <span>{volunteer.position}</span>
                            <span className="w-1 h-1 rounded-full bg-muted-foreground/50"></span>
                            <span>{volunteer.studyField || 'Member'}</span>
                          </div>
                        </div>
                      </div>

                      {/* Score */}
                      <div className="text-right shrink-0">
                        <div className="font-display font-bold text-3xl text-primary leading-none">
                          {attendanceCount}
                        </div>
                        <div className="text-xs font-bold uppercase tracking-wider text-muted-foreground mt-1">
                          Events
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </Layout>
  );
}
