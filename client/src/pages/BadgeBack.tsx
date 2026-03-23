import { useRef } from "react";
import { Layout } from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Printer, RotateCcw } from "lucide-react";
import { useReactToPrint } from "react-to-print";

export default function BadgeBack() {
  const printRef = useRef<HTMLDivElement>(null);

  const handlePrint = useReactToPrint({
    contentRef: printRef,
    documentTitle: "Volunteer_Badge_Backs",
    onBeforeGetContent: async () => {
      document.body.classList.add('is-printing');
    },
    onAfterPrint: () => {
      document.body.classList.remove('is-printing');
    }
  });

  return (
    <Layout>
      <div className="space-y-6">
        <div className="no-print">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl font-display font-bold text-foreground">Badge Backs</h1>
              <p className="text-muted-foreground mt-1">Print the reverse side for volunteer ID badges.</p>
            </div>
            <div className="flex items-center gap-2">
              <Button 
                onClick={() => handlePrint()} 
                className="rounded-xl shadow-lg shadow-primary/20"
              >
                <Printer className="w-4 h-4 mr-2" /> Print Page (4 Backs)
              </Button>
            </div>
          </div>

          <div className="mt-8 flex justify-center">
             <div className="scale-75 origin-top border-2 border-dashed border-muted-foreground/20 rounded-2xl p-4 bg-muted/5">
                <BadgeBackID />
             </div>
          </div>
          
          <div className="max-w-md mx-auto mt-4 text-center p-4 bg-primary/5 rounded-2xl border border-primary/10">
            <p className="text-sm text-primary font-medium flex items-center justify-center gap-2">
              <RotateCcw className="w-4 h-4" /> Tip: Print these on the back of your ID cards.
            </p>
          </div>
        </div>

        {/* Hidden Print Container */}
        <div className="print-only">
          <div ref={printRef} className="bg-white">
            <style>{`
              @page {
                size: A4;
                margin: 10mm;
              }
              @media print {
                .page-break:not(:last-child) {
                  page-break-after: always;
                  break-after: page;
                }
                body {
                  print-color-adjust: exact;
                  -webkit-print-color-adjust: exact;
                }
              }
            `}</style>
            
            <div className="page-break w-full">
              <div className="grid grid-cols-2 gap-x-4 gap-y-8 justify-items-center w-full py-4">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="inline-block" style={{ breakInside: 'avoid', pageBreakInside: 'avoid' }}>
                    <BadgeBackID />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}

function BadgeBackID() {
  return (
    <div 
      className="w-[300px] h-[450px] bg-white border-[1px] border-gray-200 shadow-lg relative flex flex-col items-center justify-center p-8 text-black font-sans overflow-hidden"
      style={{ printColorAdjust: 'exact', WebkitPrintColorAdjust: 'exact' }}
    >
      {/* Background Accent - Mirroring the front */}
      <div className="absolute bottom-0 left-0 w-full h-24 bg-primary/5 skew-y-6 translate-y-8" />
      
      {/* Watermark Logo */}
      <div className="absolute inset-0 flex items-center justify-center opacity-[0.03] pointer-events-none grayscale">
        <img src="/smile-club-logo.png" alt="" className="w-64 object-contain" />
      </div>

      <div className="z-10 flex flex-col items-center gap-12 w-full">
        {/* Operation Smile in Madagascar Logo */}
        <div className="w-full flex justify-center">
          <img 
            src="/operation-smile-mada-logo.png" 
            alt="Operation Smile in Madagascar" 
            className="w-full max-h-[120px] object-contain"
          />
        </div>

        {/* Divider */}
        <div className="h-0.5 w-16 bg-primary/20 rounded-full" />

        {/* Operation Smile Student Programs Logo */}
        <div className="w-full flex justify-center">
          <img 
            src="/operation-smile-student-programs-logo.png" 
            alt="Operation Smile Student Programs" 
            className="w-full max-h-[120px] object-contain"
          />
        </div>
      </div>

      {/* Footer Text */}
      <div className="mt-12 text-center z-10">
        <p className="text-[10px] text-gray-400 font-medium tracking-widest uppercase mb-1">Affiliated with</p>
        <p className="font-display text-primary text-base font-bold">Smile Club Mahajanga</p>
      </div>

      {/* Decorative Bottom Bar */}
      <div className="h-2 w-full bg-primary absolute bottom-0 left-0" />
    </div>
  );
}
