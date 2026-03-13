import { useRef, useState } from "react";
import { Layout } from "@/components/Layout";
import { useVolunteers } from "@/hooks/use-volunteers";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Printer, User, CheckCircle2, Circle } from "lucide-react";
import { useReactToPrint } from "react-to-print";
import { Checkbox } from "@/components/ui/checkbox";

export default function Badges() {
  const { data: volunteers, isLoading } = useVolunteers();
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const printRef = useRef<HTMLDivElement>(null);

  const handlePrint = useReactToPrint({
    contentRef: printRef,
    documentTitle: "Volunteer_Badges",
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

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-display font-bold text-foreground">Volunteer Badges</h1>
            <p className="text-muted-foreground mt-1">Select and print ID badges for the team.</p>
          </div>
          <div className="flex items-center gap-2">
            {selectedIds.length > 0 && (
              <Button 
                variant="outline"
                onClick={deselectAll}
                className="rounded-xl border-dashed"
              >
                Clear ({selectedIds.length})
              </Button>
            )}
            <Button 
              onClick={() => handlePrint()} 
              disabled={selectedIds.length === 0}
              className="rounded-xl shadow-lg shadow-primary/20"
            >
              <Printer className="w-4 h-4 mr-2" /> Print Selected ({selectedIds.length})
            </Button>
          </div>
        </div>

        <div className="flex items-center gap-4 py-2 border-b border-border/50">
          <Button variant="ghost" size="sm" onClick={selectAll} className="text-xs font-medium h-8">
            <CheckCircle2 className="w-3.5 h-3.5 mr-1.5" /> Select All
          </Button>
          <Button variant="ghost" size="sm" onClick={deselectAll} className="text-xs font-medium h-8 text-muted-foreground">
            <Circle className="w-3.5 h-3.5 mr-1.5" /> Deselect All
          </Button>
        </div>

        {isLoading ? (
          <div className="text-center py-12 text-muted-foreground">Loading volunteers...</div>
        ) : !volunteers?.length ? (
          <div className="text-center py-12 border-2 border-dashed rounded-2xl">
            <User className="w-12 h-12 text-muted mx-auto mb-3" />
            <p className="text-muted-foreground">No volunteers found to generate badges.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
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

        {/* Hidden Print Container */}
        <div className="print-only">
          <div ref={printRef} className="bg-white">
            <style>{`
              @page {
                size: A4;
                margin: 10mm;
              }
              @media print {
                .page-break {
                  page-break-after: always;
                  break-after: page;
                }
                body {
                  print-color-adjust: exact;
                  -webkit-print-color-adjust: exact;
                }
              }
            `}</style>
            
            {/* Chunk volunteers into groups of 4 */}
            {Array.from({ length: Math.ceil(selectedVolunteers.length / 4) }).map((_, pageIndex) => (
              <div key={pageIndex} className="page-break w-full">
                <div className="grid grid-cols-2 gap-x-4 gap-y-8 justify-items-center w-full py-4">
                  {selectedVolunteers.slice(pageIndex * 4, pageIndex * 4 + 4).map((volunteer) => (
                    <div key={volunteer.id} className="inline-block" style={{ breakInside: 'avoid', pageBreakInside: 'avoid' }}>
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

function BadgeCard({ volunteer, isSelected, onSelect }: { volunteer: any, isSelected: boolean, onSelect: () => void }) {
  const componentRef = useRef<HTMLDivElement>(null);
  const handlePrint = useReactToPrint({
    contentRef: componentRef,
  });

  return (
    <Card 
      className={`p-4 flex flex-col items-center gap-4 bg-card border-2 transition-all duration-300 rounded-2xl overflow-hidden relative
        ${isSelected ? 'border-primary shadow-lg ring-1 ring-primary/20' : 'border-transparent shadow-md hover:border-border/50 hover:shadow-xl'}
      `}
    >
      <div className="absolute top-4 left-4 z-20">
        <Checkbox 
          checked={isSelected} 
          onCheckedChange={onSelect}
          className="w-5 h-5 rounded-md data-[state=checked]:bg-primary data-[state=checked]:border-primary"
        />
      </div>
      
      <div className="scale-75 origin-top -mb-16 cursor-pointer" onClick={onSelect}>
        <BadgeID volunteer={volunteer} ref={componentRef} />
      </div>
      
      <div className="w-full flex gap-2 mt-2">
        <Button variant="outline" size="sm" className="flex-1 rounded-xl" onClick={() => handlePrint()}>
          <Printer className="w-3.5 h-3.5 mr-2" /> Print One
        </Button>
      </div>
    </Card>
  );
}

import React from "react";

const BadgeID = React.forwardRef<HTMLDivElement, { volunteer: any }>(({ volunteer }, ref) => {
  return (
    <div 
      ref={ref}
      className="w-[300px] h-[450px] bg-white border-[1px] border-gray-200 shadow-lg relative flex flex-col items-center p-6 text-black font-sans overflow-hidden"
      style={{ printColorAdjust: 'exact', WebkitPrintColorAdjust: 'exact' }}
    >
      {/* Background Accent */}
      <div className="absolute top-0 left-0 w-full h-24 bg-primary/5 -skew-y-6 -translate-y-8" />
      
      {/* Watermark Logo */}
      <div className="absolute inset-0 flex items-center justify-center opacity-[0.03] pointer-events-none grayscale">
        <img src="/smile-club-logo.png" alt="" className="w-64 object-contain" />
      </div>

      {/* Logo */}
      <div className="z-10 mt-2 mb-6">
        <img src="/smile-club-logo.png" alt="Logo" className="h-16 object-contain" />
      </div>

      {/* Photo */}
      <div className="w-36 h-36 rounded-2xl overflow-hidden border-4 border-white shadow-xl z-10 bg-gray-50 mb-4 ring-1 ring-gray-100">
        {volunteer.photo ? (
          <img src={volunteer.photo} alt={volunteer.fullName} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gray-100 text-gray-300">
            <User className="w-16 h-16" />
          </div>
        )}
      </div>

      {/* Details */}
      <div className="text-center z-10 flex-1 flex flex-col justify-center">
        <h2 className="text-xl font-bold uppercase tracking-tight leading-tight px-2">{volunteer.fullName}</h2>
        <div className="h-0.5 w-12 bg-primary mx-auto my-2 rounded-full" />
        <p className="text-sm font-semibold text-primary uppercase tracking-widest mb-2">{volunteer.position}</p>
        <div className="space-y-0.5">
          <p className="text-[10px] text-gray-500 font-medium">{volunteer.contact}</p>
        </div>
      </div>

      {/* Footer */}
      <div className="mt-auto w-full text-center z-10">
        <div className="py-2 border-t border-gray-100">
          <p className="italic font-display text-gray-400 text-sm">"For the patients"</p>
        </div>
        <div className="h-2 w-full bg-primary absolute bottom-0 left-0" />
      </div>
    </div>
  );
});

BadgeID.displayName = "BadgeID";
