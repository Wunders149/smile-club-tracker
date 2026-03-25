import { useState, useRef } from "react";
import { Layout } from "@/components/Layout";
import { useVolunteerRankings } from "@/hooks/use-volunteers";
import { Card, CardContent } from "@/components/ui/card";
import { Trophy, Medal, Star, Calendar, Download } from "lucide-react";
import { motion } from "framer-motion";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { toCanvas } from "html-to-image";
import { useToast } from "@/hooks/use-toast";
import { jsPDF } from "jspdf";

export default function Rankings() {
  const currentYear = new Date().getFullYear();
  const [selectedYear, setSelectedYear] = useState<number>(currentYear);
  const { data: rankings, isLoading } = useVolunteerRankings(selectedYear);
  const { toast } = useToast();
  const rankingRef = useRef<HTMLDivElement>(null);
  const [isDownloading, setIsDownloading] = useState(false);

  const years = [currentYear, currentYear - 1];

  const downloadAsPDF = async () => {
    if (!rankingRef.current) return;
    
    setIsDownloading(true);
    toast({
      title: "Preparing PDF",
      description: "Generating high-fidelity document...",
    });

    try {
      // Temporarily show the watermark for PDF generation
      const watermark = rankingRef.current.querySelector('.show-on-export') as HTMLElement;
      if (watermark) {
        watermark.style.display = 'flex';
      }

      // Capture at a fixed width to ensure horizontal fit regardless of screen size
      const captureWidth = 1000;
      const canvas = await toCanvas(rankingRef.current, {
        pixelRatio: 2,
        backgroundColor: "#fcfaf8",
        width: captureWidth,
        style: {
          width: `${captureWidth}px`,
          margin: '0',
          padding: '20px', // Extra internal padding for the snapshot
          transform: 'none',
        }
      });

      // Re-hide the watermark
      if (watermark) {
        watermark.style.display = 'none';
      }

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      
      const margin = 10; // 10mm margin
      const usableWidth = pdfWidth - (margin * 2);
      const usableHeight = pdfHeight - (margin * 2);
      
      const imgWidth = usableWidth;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      
      let heightLeft = imgHeight;
      let page = 0;

      // Vertical pagination logic
      while (heightLeft > 0) {
        if (page > 0) pdf.addPage();
        
        // Calculate Y position to "scroll" the image across pages
        // We start at 'margin' and offset by the height already covered
        const yPos = margin - (page * usableHeight);
        
        pdf.addImage(imgData, 'PNG', margin, yPos, imgWidth, imgHeight, undefined, 'FAST');
        
        heightLeft -= usableHeight;
        page++;
      }

      pdf.save(`Smile-Club-Rankings-${selectedYear}.pdf`);
      
      toast({
        title: "Success!",
        description: "Ranking PDF downloaded successfully.",
      });
    } catch (err) {
      console.error("Failed to download PDF", err);
      toast({
        title: "Download failed",
        description: "Could not generate the PDF. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <Layout>
      <div className="space-y-6 md:space-y-8 max-w-4xl mx-auto">
        <div className="text-center py-4 md:py-8">
          <div className="inline-flex items-center justify-center w-12 h-12 md:w-16 md:h-16 rounded-full bg-accent/20 text-accent mb-4">
            <Trophy className="w-6 h-6 md:w-8 md:h-8" />
          </div>
          <h1 className="text-2xl md:text-4xl font-display font-bold text-foreground">Volunteer Rankings</h1>
          <p className="text-muted-foreground mt-2 md:mt-3 text-base md:text-lg px-4">Celebrating the dedication of our amazing Smile Club members.</p>
          
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mt-6 md:mt-8 px-4">
            <div className="flex items-center gap-2 md:gap-3 bg-muted/50 p-1 rounded-2xl border border-border/50 w-full sm:w-auto">
              <div className="pl-3 text-muted-foreground flex items-center gap-2">
                <Calendar className="w-3.5 h-3.5 md:w-4 md:h-4" />
                <span className="text-[10px] md:text-sm font-bold uppercase tracking-wider">Year:</span>
              </div>
              <Select value={selectedYear.toString()} onValueChange={(v) => setSelectedYear(Number(v))}>
                <SelectTrigger className="w-full sm:w-[140px] rounded-xl border-none bg-card shadow-sm h-9 text-xs md:text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="rounded-xl">
                  {years.map(y => (
                    <SelectItem key={y} value={y.toString()} className="rounded-lg">
                      {y} Ranking
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <Button 
              variant="outline" 
              onClick={downloadAsPDF}
              disabled={isLoading || !rankings?.length || isDownloading}
              className="rounded-xl border-primary/20 text-primary hover:bg-primary/5 h-11 w-full sm:w-auto shadow-sm"
            >
              {isDownloading ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
                  Generating...
                </div>
              ) : (
                <>
                  <Download className="w-4 h-4 mr-2" />
                  Download as PDF
                </>
              )}
            </Button>
          </div>
        </div>

        {isLoading ? (
          <div className="text-center py-12 text-muted-foreground italic animate-pulse">Fetching {selectedYear} leaderboard...</div>
        ) : !rankings?.length ? (
          <div className="text-center py-16 bg-card rounded-3xl border border-border/50 mx-4">
            <Star className="w-12 h-12 text-muted mx-auto mb-3 opacity-20" />
            <p className="font-medium text-lg">No records found for {selectedYear}</p>
          </div>
        ) : (
          <div ref={rankingRef} className="space-y-3 md:space-y-4 px-2 md:px-0 pb-12">
            {/* Watermark for Exported PDF */}
            <div className="hidden show-on-export flex items-center justify-between mb-8 pb-4 border-b border-border/50">
              <div className="flex items-center gap-4">
                <img src="/smile-club-logo.png" alt="Logo" className="h-10 object-contain" />
                <div>
                  <h2 className="text-lg font-display font-bold text-foreground leading-none">Smile Club Mahajanga</h2>
                  <p className="text-[10px] text-muted-foreground uppercase tracking-widest mt-1">Volunteer Leaderboard {selectedYear}</p>
                </div>
              </div>
              <div className="text-right">
                <div className="text-xs font-bold text-primary uppercase tracking-widest italic">Official Ranking</div>
              </div>
            </div>

            {rankings.map((record, index) => {
              const { volunteer, totalPoints } = record;
              
              const isFirst = index === 0;
              const isSecond = index === 1;
              const isThird = index === 2;
              
              let cardStyle = "bg-card hover:border-border transition-all";
              let badgeStyle = "bg-muted text-muted-foreground border-border";
              let textStyle = "text-foreground";
              let subtextStyle = "text-muted-foreground";
              
              if (isFirst) {
                cardStyle = "bg-[#FFD700] text-amber-950 border-amber-400/50 sm:scale-[1.02] shadow-xl shadow-amber-200/50 z-10 relative";
                badgeStyle = "bg-amber-100 text-amber-600 border-amber-200";
                textStyle = "text-amber-950";
                subtextStyle = "text-amber-800/70";
              } else if (isSecond) {
                cardStyle = "bg-[#C0C0C0] text-slate-900 border-slate-300/50 shadow-lg shadow-slate-200/50";
                badgeStyle = "bg-slate-100 text-slate-500 border-slate-200";
                textStyle = "text-slate-900";
                subtextStyle = "text-slate-700/70";
              } else if (isThird) {
                cardStyle = "bg-[#CD7F32] text-orange-950 border-orange-400/50 shadow-md shadow-orange-100/50";
                badgeStyle = "bg-orange-500 text-white border-orange-400";
                textStyle = "text-orange-950";
                subtextStyle = "text-orange-900/70";
              }

              return (
                <motion.div 
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  key={`${selectedYear}-${volunteer.id}`}
                >
                  <Card className={`border rounded-2xl overflow-hidden ${cardStyle}`}>
                    <CardContent className="p-3 md:p-6 flex items-center gap-3 md:gap-4">
                      {/* Rank Number/Icon */}
                      <div className={`
                        w-10 h-10 md:w-12 md:h-12 rounded-xl md:rounded-2xl flex items-center justify-center font-display font-bold text-lg md:text-xl border-2 shrink-0
                        ${badgeStyle}
                      `}>
                        {isFirst ? <Medal className="w-5 h-5 md:w-6 md:h-6" /> : `#${index + 1}`}
                      </div>
                      
                      {/* Info */}
                      <div className="flex-1 min-w-0 flex items-center gap-3 md:gap-4">
                        <div className={`w-10 h-10 md:w-12 md:h-12 rounded-full ${isFirst || isSecond || isThird ? 'bg-white/10' : 'bg-primary/10'} text-primary flex items-center justify-center font-bold overflow-hidden shrink-0 hidden sm:flex`}>
                           {volunteer.photo ? <img src={volunteer.photo} alt={volunteer.fullName} className="w-full h-full object-cover" /> : volunteer.fullName.charAt(0)}
                        </div>
                        <div className="min-w-0">
                          <h3 className={`font-bold text-base md:text-lg ${textStyle} truncate`}>{volunteer.fullName}</h3>
                          <div className={`flex items-center gap-1.5 text-[10px] md:text-sm ${subtextStyle} mt-0.5`}>
                            <span className="truncate">{volunteer.position}</span>
                            <span className="w-1 h-1 rounded-full bg-current opacity-30 shrink-0"></span>
                            <span className="truncate">{volunteer.studyField || 'Member'}</span>
                          </div>
                        </div>
                      </div>

                      {/* Score */}
                      <div className="text-right shrink-0 ml-2">
                        <div className={`font-display font-bold text-2xl md:text-3xl ${isFirst || isSecond || isThird ? 'text-white' : 'text-primary'} leading-none`}>
                          {totalPoints}
                        </div>
                        <div className={`text-[10px] font-bold uppercase tracking-wider ${subtextStyle} mt-1`}>
                          Pts
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
