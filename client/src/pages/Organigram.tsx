import { useRef } from "react";
import { Layout } from "@/components/Layout";
import { useVolunteers } from "@/hooks/use-volunteers";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Printer, User, Network } from "lucide-react";
import { useReactToPrint } from "react-to-print";
import { type Volunteer } from "@shared/schema";

export default function Organigram() {
  const { data: volunteers, isLoading } = useVolunteers();
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
    return volunteers?.filter(v => 
      v.department === dept && 
      !v.position.includes("Officer") && 
      v.position !== "President" && 
      v.position !== "Vice President"
    ) || [];
  };

  const OrgBox = ({ person, title, isSide }: { person?: Volunteer, title: string, isSide?: boolean }) => (
    <div className={`flex flex-col items-center ${isSide ? 'opacity-80' : ''}`}>
      <div className={`
        min-w-[180px] p-4 rounded-2xl border-2 bg-card text-center shadow-md relative
        ${isSide ? 'border-dashed border-muted-foreground/30' : 'border-primary/20'}
      `}>
        <div className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1">{title}</div>
        <div className="font-bold text-foreground truncate px-2">
          {person ? person.fullName : <span className="text-muted-foreground/40 italic">Vacant</span>}
        </div>
      </div>
    </div>
  );

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
          />
        </Card>

        {/* Printable version */}
        <div className="print-only">
          <div ref={printRef} className="p-10 bg-white text-black w-full min-h-screen">
            <style>{`
              @page { size: landscape; margin: 10mm; }
              @media print {
                body { print-color-adjust: exact; -webkit-print-color-adjust: exact; background: white !important; }
                .org-box { border: 1.5px solid #000 !important; }
                .connector-line { background-color: #000 !important; }
              }
            `}</style>
            
            <div className="flex justify-between items-center mb-12 border-b-2 border-gray-900 pb-6">
              <img src="/smile-club-logo.png" alt="Logo" className="h-16" />
              <div className="text-right">
                <h1 className="text-2xl font-black uppercase tracking-tighter">Organizational Structure</h1>
                <p className="text-sm font-bold text-primary">Smile Club Mahajanga • {new Date().getFullYear()}</p>
              </div>
            </div>

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

            <div className="mt-auto pt-12 text-[10px] font-bold uppercase tracking-widest text-gray-300 text-center">
              Changing lives, one smile at a time.
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}

function OrgChart({ volunteers, president, vicePresident, pastPresident, advisor, executiveHeads, getCommitteeMembers, isPrint }: any) {
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
                  <div className="bg-muted/30 rounded-xl p-3 border border-border/50">
                    <div className="text-[8px] font-black uppercase tracking-tighter text-muted-foreground/60 mb-2 border-b border-border/50 pb-1">Committee</div>
                    <div className="space-y-1.5">
                      {committee.length > 0 ? committee.map((m: any) => (
                        <div key={m.id} className="text-[10px] font-medium leading-tight flex items-center gap-1.5">
                          <div className="w-1 h-1 rounded-full bg-primary/40" />
                          {m.fullName}
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
    <div className="flex flex-col items-center">
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
