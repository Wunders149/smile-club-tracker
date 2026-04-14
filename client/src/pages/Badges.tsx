import { useRef, useState } from "react";
import { Link } from "wouter";
import { Layout } from "@/components/Layout";
import { useVolunteers } from "@/hooks/use-volunteers";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Printer, User, CheckCircle2, Circle, RotateCcw, Download } from "lucide-react";
import { useReactToPrint } from "react-to-print";
import { Checkbox } from "@/components/ui/checkbox";

/**
 * Volunteer Badges Page
 * 
 * Features:
 * - Select and batch print ID badges
 * - Preview each badge before printing
 * - Responsive grid layout for selection
 * - Optimized A4 print layout (4 badges per page)
 * - Professional badge design with photos
 */
export default function Badges() {
  const { data: volunteers, isLoading } = useVolunteers();
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const printRef = useRef<HTMLDivElement>(null);

  const handlePrint = useReactToPrint({
    contentRef: printRef,
    documentTitle: `Volunteer_Badges_${new Date().toISOString().split('T')[0]}`,
    bodyClass: "is-printing",
    onBeforePrint: async () => {
      document.body.classList.add('is-printing');
    },
    onAfterPrint: () => {
      document.body.classList.remove('is-printing');
    }
  });

  const toggleSelect = (id: number) => {
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const selectAll = () => {
    if (volunteers) {
      setSelectedIds(volunteers.map(v => v.id));
    }
  };

  const deselectAll = () => {
    setSelectedIds([]);
  };

  const selectedVolunteers = volunteers?.filter(v => selectedIds.includes(v.id)) || [];
  const totalPages = Math.ceil(selectedVolunteers.length / 4);

  return (
    <Layout>
      <div className="space-y-6">
        <div className="no-print">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center justify-between">
            <div>
              <h1 className="text-3xl font-display font-bold text-foreground">Volunteer Badges</h1>
              <p className="text-muted-foreground mt-1">Select and print professional ID badges for your team.</p>
            </div>
            <div className="flex flex-col gap-2 sm:flex-row items-stretch sm:items-center">
              <Link href="/badge-back">
                <Button variant="outline" className="rounded-xl border-primary/20 text-primary hover:bg-primary/5 w-full sm:w-auto">
                  <RotateCcw className="w-4 h-4 mr-2" /> Badge Backs
                </Button>
              </Link>
              {selectedIds.length > 0 && (
                <Button 
                  variant="outline"
                  onClick={deselectAll}
                  className="rounded-xl border-dashed w-full sm:w-auto"
                >
                  Clear ({selectedIds.length})
                </Button>
              )}
              <Button 
                onClick={() => handlePrint()} 
                disabled={selectedIds.length === 0}
                className="rounded-xl shadow-lg shadow-primary/20 w-full sm:w-auto"
              >
                <Printer className="w-4 h-4 mr-2" /> 
                Print Selected 
                {selectedIds.length > 0 && ` (${totalPages} page${totalPages !== 1 ? 's' : ''})`}
              </Button>
            </div>
          </div>

          {/* Selection Controls */}
          <div className="flex items-center gap-4 py-4 border-b border-border/50 flex-wrap">
            <Button variant="ghost" size="sm" onClick={selectAll} className="text-xs font-medium h-8">
              <CheckCircle2 className="w-3.5 h-3.5 mr-1.5" /> Select All
            </Button>
            <Button variant="ghost" size="sm" onClick={deselectAll} className="text-xs font-medium h-8 text-muted-foreground">
              <Circle className="w-3.5 h-3.5 mr-1.5" /> Deselect All
            </Button>
            {selectedIds.length > 0 && (
              <span className="text-sm text-muted-foreground ml-auto">
                {selectedIds.length} selected • {totalPages} page{totalPages !== 1 ? 's' : ''}
              </span>
            )}
          </div>

          {/* Main Content */}
          {isLoading ? (
            <div className="text-center py-12 text-muted-foreground">
              <div className="animate-pulse">Loading volunteers...</div>
            </div>
          ) : !volunteers?.length ? (
            <div className="text-center py-12 border-2 border-dashed rounded-2xl">
              <User className="w-12 h-12 text-muted mx-auto mb-3" />
              <p className="text-muted-foreground">No volunteers found to generate badges.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6 pt-6">
              {volunteers.map((volunteer) => (
                <BadgeCard 
                  key={volunteer.id} 
                  volunteer={volunteer} 
                  isSelected={selectedIds.includes(volunteer.id)}
                  onSelect={() => toggleSelect(volunteer.id)}
                />
              ))}
            </div>
          )}
        </div>

        {/* Hidden Print Container - optimized for A4 */}
        <div className="print-only hidden">
          <div 
            ref={printRef} 
            className="bg-white w-full"
            style={{
              margin: 0,
              padding: 0,
              printColorAdjust: 'exact',
              WebkitPrintColorAdjust: 'exact'
            }}
          >
            {/* Print styles for proper page formatting */}
            <style>{`
              @page {
                size: A4 portrait;
                margin: 10mm;
              }
              @media print {
                .page-break {
                  page-break-after: always;
                  break-after: page;
                  margin: 0;
                  padding: 10mm;
                  width: 100%;
            box-sizing: border-box;
                }
                .page-break:last-child {
                  page-break-after: avoid;
                  break-after: avoid;
                }
                .badge-grid {
                  display: grid;
                  grid-template-columns: repeat(2, 1fr);
                  gap: 15mm;
                  width: 100%;
                  margin: 0;
                  padding: 10mm;
                }
                .badge-wrapper {
                  break-inside: avoid;
                  page-break-inside: avoid;
                  display: flex;
                  justify-content: center;
                  align-items: center;
                }
                body {
                  margin: 0;
                  padding: 0;
                  print-color-adjust: exact;
                  -webkit-print-color-adjust: exact;
                }
              }
            `}</style>
            
            {/* Chunk volunteers into groups of 4 (2x2 grid per page) */}
            {Array.from({ length: Math.ceil(selectedVolunteers.length / 4) }).map((_, pageIndex) => (
              <div key={pageIndex} className="page-break">
                <div className="badge-grid">
                  {selectedVolunteers.slice(pageIndex * 4, pageIndex * 4 + 4).map((volunteer) => (
                    <div key={volunteer.id} className="badge-wrapper">
                      <BadgeID volunteer={volunteer} />
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </Layout>
  );
}

/**
 * Badge Card Component
 * Displays individual badge preview with selection checkbox and print option
 */
function BadgeCard({ 
  volunteer, 
  isSelected, 
  onSelect 
}: { 
  volunteer: any
  isSelected: boolean
  onSelect: () => void 
}) {
  const componentRef = useRef<HTMLDivElement>(null);
  const handlePrint = useReactToPrint({
    contentRef: componentRef,
    documentTitle: `Badge_${volunteer.fullName.replace(/\s+/g, '_')}`,
    bodyClass: "is-printing",
    onBeforePrint: async () => {
      document.body.classList.add('is-printing');
    },
    onAfterPrint: () => {
      document.body.classList.remove('is-printing');
    }
  });

  return (
    <Card 
      className={`p-3 sm:p-4 flex flex-col items-center gap-3 bg-card border-2 transition-all duration-300 rounded-2xl overflow-hidden relative
        ${isSelected 
          ? 'border-primary shadow-lg ring-1 ring-primary/20 bg-primary/5' 
          : 'border-transparent shadow-md hover:border-border/50 hover:shadow-lg'
        }
      `}
    >
      {/* Selection Checkbox */}
      <div className="absolute top-2 sm:top-3 left-2 sm:left-3 z-20">
        <Checkbox 
          checked={isSelected} 
          onCheckedChange={onSelect}
          className="w-5 h-5 rounded-md data-[state=checked]:bg-primary data-[state=checked]:border-primary cursor-pointer"
          aria-label={`Select ${volunteer.fullName}`}
        />
      </div>
      
      {/* Badge Preview - Scaled Down */}
      <div 
        className="mt-6 scale-[0.6] sm:scale-[0.65] origin-top cursor-pointer transition-transform hover:scale-[0.62] sm:hover:scale-[0.67]" 
        onClick={onSelect}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => e.key === 'Enter' && onSelect()}
      >
        <BadgeID volunteer={volunteer} ref={componentRef} />
      </div>
      
      {/* Action Buttons */}
      <div className="w-full flex gap-2 mt-2">
        <Button 
          variant="outline" 
          size="sm" 
          className="flex-1 rounded-lg text-xs sm:text-sm h-8 sm:h-9" 
          onClick={() => handlePrint()}
          title="Print this badge"
        >
          <Printer className="w-3 h-3 sm:w-3.5 sm:h-3.5 mr-1 sm:mr-2" /> 
          <span className="hidden sm:inline">Print</span>
          <span className="sm:hidden">Print</span>
        </Button>
      </div>

      {/* Volunteer Info - for reference */}
      <div className="w-full text-center text-xs mt-2 pt-2 border-t border-border/30">
        <p className="font-semibold text-foreground line-clamp-1">{volunteer.fullName}</p>
        <p className="text-muted-foreground line-clamp-1">{volunteer.position}</p>
      </div>
    </Card>
  );
}

/**
 * Badge ID Component
 * Professional ID badge design with photo, name, position, and branding
 */
import React from "react";

const BadgeID = React.forwardRef<HTMLDivElement, { volunteer: any }>(({ volunteer }, ref) => {
  return (
    <div 
      ref={ref}
      className="w-[7.9cm] h-[9.9cm] bg-white border-2 border-gray-300 shadow-xl relative flex flex-col items-center p-4 text-black font-sans overflow-hidden rounded-lg"
      style={{ 
        printColorAdjust: 'exact', 
        WebkitPrintColorAdjust: 'exact',
        pageBreakInside: 'avoid'
      }}
    >
      {/* Subtle Background Gradient */}
      <div className="absolute top-0 left-0 w-full h-14 bg-gradient-to-b from-primary/8 to-transparent" />
      
      {/* Watermark Logo - Very Subtle */}
      <div className="absolute inset-0 flex items-center justify-center opacity-[0.02] pointer-events-none">
        <div className="text-9xl font-bold text-gray-300">✓</div>
      </div>

      {/* Header - Logo */}
      <div className="z-10 mt-1 mb-2">
        <img 
          src="/smile-club-logo.png" 
          alt="Smile Club Logo" 
          className="h-10 sm:h-12 object-contain" 
          onError={(e) => {
            (e.target as HTMLImageElement).src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"%3E%3Ccircle cx="50" cy="50" r="45" fill="%23c85a2c" opacity="0.2"/%3E%3Ctext x="50" y="55" text-anchor="middle" font-size="24" font-family="Arial" fill="%23c85a2c"%3E☺%3C/text%3E%3C/svg%3E';
          }}
        />
      </div>

      {/* Photo Container */}
      <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-xl overflow-hidden border-4 border-white shadow-lg z-10 bg-gray-50 mb-2 ring-2 ring-primary/30">
        {volunteer.photo ? (
          <img 
            src={volunteer.photo} 
            alt={volunteer.fullName} 
            className="w-full h-full object-cover" 
            onError={(e) => {
              (e.target as HTMLImageElement).style.display = 'none';
              (e.target as HTMLImageElement).nextElementSibling?.classList.remove('hidden');
            }}
          />
        ) : null}
        <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200 text-gray-400">
          <User className="w-10 h-10" />
        </div>
      </div>

      {/* Divider */}
      <div className="h-px w-8 bg-gradient-to-r from-transparent via-primary to-transparent my-1" />

      {/* Volunteer Details */}
      <div className="text-center z-10 flex-1 flex flex-col justify-center px-1">
        {/* Name */}
        <h2 className="text-xs sm:text-sm font-bold uppercase tracking-tight leading-tight line-clamp-2">
          {volunteer.displayName || volunteer.fullName}
        </h2>
        
        {/* Position */}
        <p className="text-[9px] font-semibold text-primary uppercase tracking-wider mt-0.5 line-clamp-2">
          {volunteer.position}
        </p>
        
        {/* Contact Info */}
        {volunteer.contact && (
          <p className="text-[8px] text-gray-600 font-medium mt-0.5 line-clamp-1">
            {volunteer.contact}
          </p>
        )}
      </div>

      {/* Footer Section */}
      <div className="w-full mt-auto z-10 border-t border-gray-200">
        <div className="py-1">
          <p className="italic font-display text-gray-500 text-[8px] font-semibold tracking-wide mb-1">
            "For The Patients!"
          </p>
          <div className="h-1.5 w-full bg-gradient-to-r from-primary via-primary to-primary/70 rounded-t" />
        </div>
      </div>
    </div>
  );
});

BadgeID.displayName = "BadgeID";
