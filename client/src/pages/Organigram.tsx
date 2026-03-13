import { useRef, useState } from "react";
import { Layout } from "@/components/Layout";
import { useVolunteers, useUpdateVolunteer } from "@/hooks/use-volunteers";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Printer, User, Network, Check, Search } from "lucide-react";
import { useReactToPrint } from "react-to-print";
import { type Volunteer, DEPARTMENTS } from "@shared/schema";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { format } from "date-fns";

export default function Organigram() {
  const { data: volunteers, isLoading } = useVolunteers();
  const updateMut = useUpdateVolunteer();
  const [selectedDept, setSelectedDept] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const printRef = useRef<HTMLDivElement>(null);

  const handlePrint = useReactToPrint({
    contentRef: printRef,
    documentTitle: "Smile_Club_Mahajanga_Organigram",
  });

  if (isLoading) return <Layout><div className="text-center py-12 text-muted-foreground">Loading organizational data...</div></Layout>;

  // Organizational structure logic
  const president = volunteers?.find(v => v.position === "President");
  const vicePresident = volunteers?.find(v => v.position === "Vice President");
  const pastPresident = volunteers?.find(v => v.position === "Past President");
  const advisor = volunteers?.find(v => v.position === "Advisor");

  const executiveHeads = [
    { title: "Head of Administration", pos: "Administration Officer", dept: "Administration" },
    { title: "Head of Education", pos: "Education Officer", dept: "Education" },
    { title: "Head of Fundraising", pos: "Fundraising Officer", dept: "Fundraising" },
    { title: "Head of Finance", pos: "Financial Officer", dept: "Finance" },
    { title: "Head of Communications", pos: "Communication Officer", dept: "Communications" },
  ];

  const getCommitteeMembers = (dept: string) => {
    return (volunteers?.filter(v => 
      v.department === dept && 
      !v.position.includes("Officer") && 
      v.position !== "President" && 
      v.position !== "Vice President"
    ) || []).sort((a, b) => {
      // Assisting Board Member at the top
      if (a.position === "Assisting Board Member" && b.position !== "Assisting Board Member") return -1;
      if (a.position !== "Assisting Board Member" && b.position === "Assisting Board Member") return 1;
      return a.fullName.localeCompare(b.fullName);
    });
  };

  const handleToggleVolunteer = async (volunteer: Volunteer) => {
    if (!selectedDept) return;
    const newDept = volunteer.department === selectedDept ? "None" : selectedDept;
    await updateMut.mutateAsync({ id: volunteer.id, department: newDept });
  };

  const filteredVolunteers = volunteers?.filter(v => 
    v.fullName.toLowerCase().includes(searchQuery.toLowerCase()) &&
    v.position !== "President" && v.position !== "Vice President" && !v.position.includes("Officer")
  ) || [];

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 no-print">
          <div>
            <h1 className="text-3xl font-display font-bold text-foreground">Organizational Chart</h1>
            <p className="text-muted-foreground mt-1">Structure and leadership of Smile Club Mahajanga.</p>
          </div>
          <Button onClick={() => handlePrint()} className="rounded-xl shadow-lg shadow-primary/20">
            <Printer className="w-4 h-4 mr-2" /> Print Organigram
          </Button>
        </div>

        <Card className="p-12 overflow-x-auto bg-card border-border/50 shadow-xl rounded-3xl min-w-[1000px] no-print">
          <OrgChart 
            volunteers={volunteers}
            president={president} 
            vicePresident={vicePresident} 
            pastPresident={pastPresident}
            advisor={advisor}
            executiveHeads={executiveHeads}
            getCommitteeMembers={getCommitteeMembers}
            onCommitteeClick={(dept: string) => setSelectedDept(dept)}
          />
        </Card>

        {/* Selection Dialog */}
        <Dialog open={!!selectedDept} onOpenChange={(open) => !open && setSelectedDept(null)}>
          <DialogContent className="sm:max-w-[500px] rounded-3xl">
            <DialogHeader>
              <DialogTitle className="text-2xl font-display">Manage {selectedDept} Committee</DialogTitle>
              <DialogDescription>Add or remove volunteers from this committee.</DialogDescription>
            </DialogHeader>
            
            <div className="relative mt-4">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input 
                placeholder="Search volunteers..." 
                className="pl-9 rounded-xl"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            <ScrollArea className="h-[400px] mt-4 pr-4">
              <div className="space-y-2">
                {filteredVolunteers.map((vol) => (
                  <button
                    key={vol.id}
                    onClick={() => handleToggleVolunteer(vol)}
                    className={cn(
                      "w-full flex items-center justify-between p-3 rounded-xl border transition-all",
                      vol.department === selectedDept 
                        ? "bg-primary/5 border-primary/20 shadow-sm" 
                        : "bg-card border-border/50 hover:border-primary/20"
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center overflow-hidden">
                        {vol.photo ? <img src={vol.photo} className="w-full h-full object-cover" /> : <User className="w-4 h-4" />}
                      </div>
                      <div className="text-left">
                        <p className="text-sm font-bold">{vol.fullName}</p>
                        <p className="text-[10px] text-muted-foreground uppercase tracking-wider">{vol.position}</p>
                      </div>
                    </div>
                    {vol.department === selectedDept && <Check className="w-4 h-4 text-primary" />}
                  </button>
                ))}
              </div>
            </ScrollArea>
          </DialogContent>
        </Dialog>

        {/* Printable version */}
        <div className="print-only">
          <div ref={printRef} className="p-0 bg-white text-black w-full font-sans">
            <style>{`
              @page {
                size: landscape;
                margin: 15mm;
              }
              @media print {
                body {
                  print-color-adjust: exact;
                  -webkit-print-color-adjust: exact;
                  background: white !important;
                }
                .print-header {
                  break-after: avoid;
                  page-break-after: avoid;
                }
                .org-node {
                  break-inside: avoid;
                }
              }
            `}</style>
            
            <div className="print-header flex justify-between items-center mb-8 border-b-2 border-gray-900 pb-6">
              <div className="flex items-center gap-4">
                <img src="/smile-club-logo.png" alt="Logo" className="h-12 object-contain" />
                <div>
                  <h1 className="text-xl font-bold tracking-tighter uppercase text-gray-900">Organizational Structure</h1>
                  <p className="text-[10px] text-gray-500 font-medium uppercase tracking-widest">Smile Club Mahajanga</p>
                </div>
              </div>
              <div className="text-right">
                <div className="text-4xl font-black text-gray-900 leading-none">{new Date().getFullYear()}</div>
                <div className="text-[7px] font-bold uppercase tracking-[0.2em] text-primary mt-1">Official Club Document</div>
              </div>
            </div>

            <div className="py-4">
              <OrgChart 
                volunteers={volunteers}
                president={president} 
                vicePresident={vicePresident} 
                pastPresident={pastPresident}
                advisor={advisor}
                executiveHeads={executiveHeads}
                getCommitteeMembers={getCommitteeMembers}
                isPrint
              />
            </div>

            <div className="mt-8 pt-6 border-t border-gray-100 flex justify-between items-end text-[7px] font-bold uppercase tracking-[0.1em] text-gray-400">
              <div>
                <p>Generated {format(new Date(), 'yyyy.MM.dd HH:mm')}</p>
                <p className="mt-0.5 text-gray-300">Smile Club Tracker Internal System</p>
              </div>
              <div className="text-right">
                <p className="text-gray-900">For The Patients!</p>
                <p className="text-[5px] text-gray-300 tracking-[0.2em]">Confidential activity log</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}

function OrgChart({ volunteers, president, vicePresident, pastPresident, advisor, executiveHeads, getCommitteeMembers, onCommitteeClick, isPrint }: any) {
  return (
    <div className="flex flex-col items-center gap-12 w-full">
      {/* Top Level: President & Vice President */}
      <div className="relative flex items-start gap-32">
        {/* Sides */}
        <div className="absolute -left-48 top-4 flex flex-col gap-4">
          <div className="p-3 rounded-xl border-2 border-dashed border-muted-foreground/20 text-center w-40 bg-muted/5">
            <div className="text-[8px] font-bold uppercase tracking-widest text-muted-foreground mb-1">Past President</div>
            <div className="text-xs font-bold">{pastPresident?.fullName || "N/A"}</div>
          </div>
          <div className="absolute left-40 top-1/2 w-8 h-[1.5px] bg-muted-foreground/20 border-t border-dashed" />
        </div>

        <div className="absolute -right-48 top-4 flex flex-col gap-4">
          <div className="p-3 rounded-xl border-2 border-dashed border-muted-foreground/20 text-center w-40 bg-muted/5">
            <div className="text-[8px] font-bold uppercase tracking-widest text-muted-foreground mb-1">Advisor</div>
            <div className="text-xs font-bold">{advisor?.fullName || "N/A"}</div>
          </div>
          <div className="absolute right-40 top-1/2 w-8 h-[1.5px] bg-muted-foreground/20 border-t border-dashed" />
        </div>

        {/* Main Top */}
        <div className="flex gap-8">
          <OrgNode person={president} title="President" primary />
          <OrgNode person={vicePresident} title="Vice President" primary />
        </div>
      </div>

      {/* Connecting Vertical Line from Top */}
      <div className="w-0.5 h-12 bg-primary/20 -mt-12" />

      {/* Executive Level */}
      <div className="w-full relative">
        <div className="absolute top-0 left-[10%] right-[10%] h-0.5 bg-primary/20" />
        <div className="flex justify-between w-full px-[5%]">
          {executiveHeads.map((head: any, idx: number) => {
            const officer = volunteers?.find((v: any) => v.position === head.pos);
            const committee = getCommitteeMembers(head.dept);
            
            return (
              <div key={idx} className="flex flex-col items-center gap-6 flex-1">
                <div className="w-0.5 h-8 bg-primary/20" />
                <div className="p-4 rounded-2xl border-2 border-primary/20 bg-card text-center shadow-md w-[180px] hover:scale-105 transition-transform duration-300">
                  <div className="text-[9px] font-bold uppercase tracking-widest text-primary mb-1">{head.title}</div>
                  <div className="text-sm font-bold truncate">
                    {officer?.fullName || <span className="text-muted-foreground/30 font-normal italic">Vacant</span>}
                  </div>
                </div>

                {/* Committee members */}
                <div className="w-0.5 h-6 bg-border/50" />
                <div className="w-full px-2">
                  <div 
                    onClick={() => !isPrint && onCommitteeClick(head.dept)}
                    className={cn(
                      "bg-muted/30 rounded-xl p-3 border border-border/50 transition-all group/box",
                      !isPrint && "cursor-pointer hover:bg-primary/[0.03] hover:border-primary/30"
                    )}
                  >
                    <div className="text-[8px] font-black uppercase tracking-tighter text-muted-foreground/60 mb-2 border-b border-border/50 pb-1 flex justify-between items-center">
                      <span>Committee</span>
                      {!isPrint && <div className="text-[7px] bg-primary/10 text-primary px-1 rounded opacity-0 group-hover/box:opacity-100 transition-opacity">Click to Manage</div>}
                    </div>
                    <div className="space-y-1.5">
                      {committee.length > 0 ? committee.map((m: any) => (
                        <div key={m.id} className={cn(
                          "text-[10px] leading-tight flex items-center gap-1.5",
                          m.position === "Assisting Board Member" ? "font-bold text-primary" : "font-medium text-foreground/80"
                        )}>
                          <div className={cn(
                            "w-1 h-1 rounded-full",
                            m.position === "Assisting Board Member" ? "bg-primary" : "bg-primary/40"
                          )} />
                          {m.fullName}
                          {m.position === "Assisting Board Member" && <span className="text-[7px] uppercase tracking-tighter opacity-60"> (ABM)</span>}
                        </div>
                      )) : (
                        <div className="text-[9px] text-muted-foreground/40 italic">No members</div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function OrgNode({ person, title, primary }: { person?: Volunteer, title: string, primary?: boolean }) {
  return (
    <div className="org-node flex flex-col items-center">
      <div className={`
        min-w-[200px] p-5 rounded-2xl border-2 text-center shadow-lg relative
        ${primary ? 'border-primary bg-primary text-white shadow-primary/20' : 'border-primary/20 bg-card text-foreground'}
      `}>
        <div className={`text-[10px] font-black uppercase tracking-[0.2em] mb-1 ${primary ? 'text-white/70' : 'text-muted-foreground'}`}>{title}</div>
        <div className="text-lg font-black tracking-tight leading-none uppercase">
          {person ? person.fullName : "VACANT"}
        </div>
      </div>
    </div>
  );
}
