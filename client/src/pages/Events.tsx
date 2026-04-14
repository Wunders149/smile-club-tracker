import { useState, useRef } from "react";
import { Layout } from "@/components/Layout";
import { useEvents, useCreateEvent, useUpdateEvent, useDeleteEvent } from "@/hooks/use-events";
import { useVolunteers } from "@/hooks/use-volunteers";
import { EVENT_TYPES, type InsertEvent, type Event } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Plus, MoreVertical, Edit2, Trash2, CalendarDays, MapPin, LayoutGrid, Calendar as CalendarIcon, User, Search, Printer } from "lucide-react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertEventSchema } from "@shared/schema";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { format, isSameDay, addHours } from "date-fns";
import { Calendar } from "@/components/ui/calendar";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { Check } from "lucide-react";
import { useReactToPrint } from "react-to-print";

// ── Color-coded event types ──
export const EVENT_TYPE_COLORS: Record<string, { bg: string; fg: string; print: string }> = {
  "Meeting":           { bg: "#dbeafe", fg: "#1d4ed8", print: "#2563eb" },
  "English Training":  { bg: "#fef3c7", fg: "#b45309", print: "#d97706" },
  "Conference":        { bg: "#ede9fe", fg: "#6d28d9", print: "#7c3aed" },
  "Surgical Programs": { bg: "#fee2e2", fg: "#b91c1c", print: "#dc2626" },
  "Awareness":         { bg: "#d1fae5", fg: "#047857", print: "#059669" },
  "Fundraising":       { bg: "#ffedd5", fg: "#c2410c", print: "#ea580c" },
  "Outing":            { bg: "#cffafe", fg: "#0e7490", print: "#0891b2" },
  "Social Work":       { bg: "#fce7f3", fg: "#be185d", print: "#db2777" },
  "Learning Time":     { bg: "#e0e7ff", fg: "#4338ca", print: "#4f46e5" },
};

export function getEventColorPrint(type: string): string {
  return EVENT_TYPE_COLORS[type]?.print ?? "#374151";
}

export function getEventColorScreen(type: string): { bg: string; fg: string } {
  const c = EVENT_TYPE_COLORS[type];
  return c ? { bg: c.bg, fg: c.fg } : { bg: "#f3f4f6", fg: "#374151" };
}

const formSchema = insertEventSchema.extend({
  date: z.coerce.date(),
  endTime: z.coerce.date().nullable().optional(),
});

type FormValues = z.infer<typeof formSchema>;

export default function Events() {
  const { data: events, isLoading } = useEvents();
  const { data: volunteers } = useVolunteers();
  const createMut = useCreateEvent();
  const updateMut = useUpdateEvent();
  const deleteMut = useDeleteEvent();

  const [isAddOpen, setIsAddOpen] = useState(false);
  const [showAddPrompt, setShowAddPrompt] = useState(false);
  const [promptDate, setPromptDate] = useState<Date | null>(null);
  const [editingEvent, setEditingEvent] = useState<Event | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [view, setView] = useState<"grid" | "calendar">("grid");
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [speakerSearchOpen, setSpeakerSearchOpen] = useState(false);

  // ── PTA year range (needed before useReactToPrint for documentTitle) ──
  const _now = new Date();
  const _currentMonth = _now.getMonth();
  const ptaStartYear = _currentMonth >= 6 ? _now.getFullYear() : _now.getFullYear() - 1;
  const ptaEndYear = ptaStartYear + 1;

  const printRef = useRef<HTMLDivElement>(null);
  const handlePrint = useReactToPrint({
    contentRef: printRef,
    documentTitle: `PTA_Smile_Club_Mahajanga_${ptaStartYear}-${ptaEndYear}`,
    bodyClass: "is-printing",
    onBeforePrint: async () => {
      document.body.classList.add('is-printing');
    },
    onAfterPrint: () => {
      document.body.classList.remove('is-printing');
    }
  });

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "", type: EVENT_TYPES[0], date: new Date(), description: "", venue: "", speaker: "", endTime: null
    }
  });

  const onEdit = (ev: Event) => {
    form.reset({
      name: ev.name, type: ev.type, date: new Date(ev.date), description: ev.description || "",
      venue: ev.venue || "", speaker: ev.speaker || "", endTime: ev.endTime ? new Date(ev.endTime) : null
    });
    setEditingEvent(ev);
  };

  const onDateChange = (newDate: Date) => {
    form.setValue("date", newDate);
    const currentEnd = form.getValues("endTime");
    if (!editingEvent && (!currentEnd || currentEnd.getTime() <= newDate.getTime())) {
      form.setValue("endTime", addHours(newDate, 1));
    }
  };

  const handleOpenAdd = () => {
    const defaultDate = new Date();
    defaultDate.setMinutes(0, 0, 0);
    form.reset({
      name: "", type: EVENT_TYPES[0], date: defaultDate, description: "", venue: "", speaker: "", endTime: addHours(defaultDate, 1)
    });
    setIsAddOpen(true);
  };

  const onSubmit = async (data: FormValues) => {
    if (editingEvent) {
      await updateMut.mutateAsync({ id: editingEvent.id, ...data });
      setEditingEvent(null);
    } else {
      await createMut.mutateAsync(data);
      setIsAddOpen(false);
    }
    form.reset();
  };

  const filteredEvents = events?.filter(ev => 
    selectedDate ? isSameDay(new Date(ev.date), selectedDate) : true
  ) || [];

  const eventDays = events?.map(ev => new Date(ev.date)) || [];

  // ── PTA (Plan de Travail Annuel): July → June ──
  const months = [
    "July", "August", "September", "October", "November", "December",
    "January", "February", "March", "April", "May", "June"
  ];

  // ── Filter events to current PTA year (July ptaStartYear → June ptaEndYear) ──
  const ptaEvents = events?.filter(ev => {
    const d = new Date(ev.date);
    const m = d.getMonth(); // 0-indexed
    const y = d.getFullYear();
    // July(6)–Dec(11): must be ptaStartYear; Jan(0)–Jun(5): must be ptaEndYear
    if (m >= 6) return y === ptaStartYear;
    return y === ptaEndYear;
  }) || [];

  // ── Group PTA events by "Year-Month" key so multi-year months don't collide ──
  const eventsByMonth = ptaEvents.reduce((acc, ev) => {
    const d = new Date(ev.date);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`; // e.g. "2025-07"
    if (!acc[key]) acc[key] = [];
    acc[key].push(ev);
    return acc;
  }, {} as Record<string, Event[]>);

  return (
    <Layout>
      <div className="space-y-6">
        <div className="no-print">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="text-center sm:text-left">
              <h1 className="text-2xl md:text-3xl font-display font-bold text-foreground">Events</h1>
              <p className="text-muted-foreground mt-1 text-sm">Plan and track all club activities.</p>
            </div>
            
            <div className="flex flex-col sm:flex-row items-center gap-3">
              <Button 
                variant="outline"
                onClick={() => handlePrint()}
                disabled={!events?.length}
                className="rounded-xl border-primary/20 text-primary hover:bg-primary/5 h-10 w-full sm:w-auto"
              >
                <Printer className="w-4 h-4 mr-2" /> Print Calendar
              </Button>

              <div className="bg-muted p-1 rounded-xl flex items-center w-full sm:w-auto justify-center">
                <Button 
                  variant={view === "grid" ? "secondary" : "ghost"} 
                  size="sm" 
                  onClick={() => setView("grid")}
                  className="rounded-lg h-8 px-3 flex-1 sm:flex-none"
                >
                  <LayoutGrid className="w-4 h-4 mr-2" /> Grid
                </Button>
                <Button 
                  variant={view === "calendar" ? "secondary" : "ghost"} 
                  size="sm" 
                  onClick={() => setView("calendar")}
                  className="rounded-lg h-8 px-3 flex-1 sm:flex-none"
                >
                  <CalendarIcon className="w-4 h-4 mr-2" /> Calendar
                </Button>
              </div>

              <Button 
                onClick={handleOpenAdd}
                className="bg-primary hover:bg-primary/90 text-white font-medium rounded-xl shadow-lg shadow-primary/20 transition-all hover:scale-105 active:scale-95 px-6 h-10 w-full sm:w-auto"
              >
                <Plus className="w-4 h-4 mr-2" /> Add Event
              </Button>

              <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
                <DialogContent className="sm:max-w-[550px] bg-card rounded-2xl max-h-[90vh] overflow-y-auto w-[95vw]">
                  <DialogHeader>
                    <DialogTitle className="font-display text-2xl text-center sm:text-left">Add New Event</DialogTitle>
                  </DialogHeader>
                  <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 pt-4">
                      <FormField control={form.control} name="name" render={({ field }) => (
                        <FormItem><FormLabel>Event Name</FormLabel><FormControl><Input placeholder="Annual Meeting..." className="rounded-xl h-12" {...field} /></FormControl><FormMessage/></FormItem>
                      )} />
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <FormField control={form.control} name="type" render={({ field }) => (
                          <FormItem>
                            <FormLabel>Event Type</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl><SelectTrigger className="rounded-xl h-12"><SelectValue /></SelectTrigger></FormControl>
                              <SelectContent>{EVENT_TYPES.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
                            </Select>
                            <FormMessage/>
                          </FormItem>
                        )} />
                        <FormField control={form.control} name="date" render={({ field }) => (
                          <FormItem>
                            <FormLabel>Start Date & Time</FormLabel>
                            <FormControl>
                              <Input 
                                type="datetime-local" 
                                className="rounded-xl h-12" 
                                value={field.value ? new Date(field.value.getTime() - field.value.getTimezoneOffset() * 60000).toISOString().slice(0, 16) : ""}
                                onChange={(e) => onDateChange(new Date(e.target.value))}
                              />
                            </FormControl>
                            <FormMessage/>
                          </FormItem>
                        )} />
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <FormField control={form.control} name="venue" render={({ field }) => (
                          <FormItem><FormLabel>Venue</FormLabel><FormControl><Input placeholder="Meeting Room A" className="rounded-xl h-12" {...field} value={field.value || ''} /></FormControl><FormMessage/></FormItem>
                        )} />
                        <FormField control={form.control} name="endTime" render={({ field }) => (
                          <FormItem>
                            <FormLabel>Ending Time</FormLabel>
                            <FormControl>
                              <Input 
                                type="datetime-local" 
                                className="rounded-xl h-12" 
                                value={field.value ? new Date(new Date(field.value).getTime() - field.value.getTimezoneOffset() * 60000).toISOString().slice(0, 16) : ""}
                                onChange={(e) => field.onChange(e.target.value ? new Date(e.target.value) : null)}
                              />
                            </FormControl>
                            <FormMessage/>
                          </FormItem>
                        )} />
                      </div>
                      
                      <FormField control={form.control} name="speaker" render={({ field }) => (
                        <FormItem className="flex flex-col">
                          <FormLabel>Speaker</FormLabel>
                          <Popover open={speakerSearchOpen} onOpenChange={setSpeakerSearchOpen}>
                            <PopoverTrigger asChild>
                              <FormControl>
                                <Button
                                  variant="outline"
                                  role="combobox"
                                  className={cn(
                                    "w-full justify-between rounded-xl font-normal h-12",
                                    !field.value && "text-muted-foreground"
                                  )}
                                >
                                  {field.value || "Select volunteer or enter name..."}
                                  <Search className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                </Button>
                              </FormControl>
                            </PopoverTrigger>
                            <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0 rounded-xl" align="start">
                              <Command>
                                <CommandInput placeholder="Search volunteers..." />
                                <CommandList>
                                  <CommandEmpty>
                                    <div className="p-2 text-center">
                                      <p className="text-xs text-muted-foreground mb-2">No volunteer found.</p>
                                      <Button 
                                        size="sm" 
                                        className="w-full text-xs"
                                        onClick={() => {
                                          const searchInput = document.querySelector('[cmdk-input]') as HTMLInputElement;
                                          if (searchInput?.value) {
                                            field.onChange(searchInput.value);
                                            setSpeakerSearchOpen(false);
                                          }
                                        }}
                                      >
                                        Use as Guest Speaker
                                      </Button>
                                    </div>
                                  </CommandEmpty>
                                  <CommandGroup heading="Volunteers">
                                    {volunteers?.map((vol) => (
                                      <CommandItem
                                        key={vol.id}
                                        value={vol.fullName}
                                        onSelect={() => {
                                          field.onChange(vol.fullName);
                                          setSpeakerSearchOpen(false);
                                        }}
                                      >
                                        <Check className={cn("mr-2 h-4 w-4", vol.fullName === field.value ? "opacity-100" : "opacity-0")} />
                                        {vol.fullName}
                                      </CommandItem>
                                    ))}
                                  </CommandGroup>
                                </CommandList>
                              </Command>
                            </PopoverContent>
                          </Popover>
                          <FormMessage />
                        </FormItem>
                      )} />

                      <FormField control={form.control} name="description" render={({ field }) => (
                        <FormItem><FormLabel>Description (optional)</FormLabel><FormControl><Textarea className="rounded-xl resize-none h-20" {...field} value={field.value || ''} /></FormControl><FormMessage/></FormItem>
                      )} />
                      <DialogFooter className="pt-4">
                        <Button type="submit" disabled={createMut.isPending} className="rounded-xl px-8 w-full h-12">
                          {createMut.isPending ? "Creating..." : "Save Event"}
                        </Button>
                      </DialogFooter>
                    </form>
                  </Form>
                </DialogContent>
              </Dialog>

              <Dialog open={!!editingEvent} onOpenChange={(open) => { if (!open) setEditingEvent(null); }}>
                 <DialogContent className="sm:max-w-[550px] bg-card rounded-2xl max-h-[90vh] overflow-y-auto w-[95vw]">
                  <DialogHeader>
                    <DialogTitle className="font-display text-2xl text-center sm:text-left">Edit Event</DialogTitle>
                  </DialogHeader>
                  <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 pt-4">
                      <FormField control={form.control} name="name" render={({ field }) => (
                        <FormItem><FormLabel>Event Name</FormLabel><FormControl><Input className="rounded-xl h-12" {...field} /></FormControl><FormMessage/></FormItem>
                      )} />
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <FormField control={form.control} name="type" render={({ field }) => (
                          <FormItem>
                            <FormLabel>Event Type</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl><SelectTrigger className="rounded-xl h-12"><SelectValue /></SelectTrigger></FormControl>
                              <SelectContent>{EVENT_TYPES.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
                            </Select>
                            <FormMessage/>
                          </FormItem>
                        )} />
                        <FormField control={form.control} name="date" render={({ field }) => (
                          <FormItem>
                            <FormLabel>Start Date & Time</FormLabel>
                            <FormControl>
                              <Input 
                                type="datetime-local" 
                                className="rounded-xl h-12" 
                                value={field.value ? new Date(field.value.getTime() - field.value.getTimezoneOffset() * 60000).toISOString().slice(0, 16) : ""}
                                onChange={(e) => onDateChange(new Date(e.target.value))}
                              />
                            </FormControl>
                            <FormMessage/>
                          </FormItem>
                        )} />
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <FormField control={form.control} name="venue" render={({ field }) => (
                          <FormItem><FormLabel>Venue</FormLabel><FormControl><Input placeholder="Meeting Room A" className="rounded-xl h-12" {...field} value={field.value || ''} /></FormControl><FormMessage/></FormItem>
                        )} />
                        <FormField control={form.control} name="endTime" render={({ field }) => (
                          <FormItem>
                            <FormLabel>Ending Time</FormLabel>
                            <FormControl>
                              <Input 
                                type="datetime-local" 
                                className="rounded-xl h-12" 
                                value={field.value ? new Date(new Date(field.value).getTime() - field.value.getTimezoneOffset() * 60000).toISOString().slice(0, 16) : ""}
                                onChange={(e) => field.onChange(e.target.value ? new Date(e.target.value) : null)}
                              />
                            </FormControl>
                            <FormMessage/>
                          </FormItem>
                        )} />
                      </div>

                      <FormField control={form.control} name="speaker" render={({ field }) => (
                        <FormItem className="flex flex-col">
                          <FormLabel>Speaker</FormLabel>
                          <Popover open={speakerSearchOpen} onOpenChange={setSpeakerSearchOpen}>
                            <PopoverTrigger asChild>
                              <FormControl>
                                <Button
                                  variant="outline"
                                  role="combobox"
                                  className={cn(
                                    "w-full justify-between rounded-xl font-normal h-12",
                                    !field.value && "text-muted-foreground"
                                  )}
                                >
                                  {field.value || "Select speaker..."}
                                  <Search className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                </Button>
                              </FormControl>
                            </PopoverTrigger>
                            <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0 rounded-xl" align="start">
                              <Command>
                                <CommandInput placeholder="Search volunteers..." />
                                <CommandList>
                                  <CommandEmpty>
                                    <div className="p-2 text-center">
                                      <p className="text-xs text-muted-foreground">No results.</p>
                                    </div>
                                  </CommandEmpty>
                                  <CommandGroup>
                                    {volunteers?.map((vol) => (
                                      <CommandItem
                                        key={vol.id}
                                        value={vol.fullName}
                                        onSelect={() => {
                                          field.onChange(vol.fullName);
                                          setSpeakerSearchOpen(false);
                                        }}
                                      >
                                        <Check className={cn("mr-2 h-4 w-4", vol.fullName === field.value ? "opacity-100" : "opacity-0")} />
                                        {vol.fullName}
                                      </CommandItem>
                                    ))}
                                  </CommandGroup>
                                </CommandList>
                              </Command>
                            </PopoverContent>
                          </Popover>
                          <FormMessage />
                        </FormItem>
                      )} />

                      <FormField control={form.control} name="description" render={({ field }) => (
                        <FormItem><FormLabel>Description</FormLabel><FormControl><Textarea className="rounded-xl resize-none h-20" {...field} value={field.value || ''} /></FormControl><FormMessage/></FormItem>
                      )} />
                      <DialogFooter className="pt-4">
                        <Button type="submit" disabled={updateMut.isPending} className="rounded-xl px-8 w-full h-12">
                          {updateMut.isPending ? "Saving..." : "Update Event"}
                        </Button>
                      </DialogFooter>
                    </form>
                  </Form>
                </DialogContent>
              </Dialog>

              <AlertDialog open={!!deletingId} onOpenChange={(open) => { if (!open) setDeletingId(null); }}>
                <AlertDialogContent className="rounded-2xl w-[95vw]">
                  <AlertDialogHeader>
                    <AlertDialogTitle>Delete Event?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This action cannot be undone. This will permanently delete the event and all associated records.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter className="flex flex-col gap-2">
                    <AlertDialogCancel className="rounded-xl mt-0">Cancel</AlertDialogCancel>
                    <AlertDialogAction 
                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90 rounded-xl"
                      onClick={async () => {
                        if (deletingId) await deleteMut.mutateAsync(deletingId);
                        setDeletingId(null);
                      }}
                    >
                      Delete
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </div>
        </div>

        {isLoading ? (
          <div className="py-12 text-center text-muted-foreground">Loading events...</div>
        ) : !events?.length ? (
          <div className="py-16 text-center bg-card rounded-2xl border border-border/50 px-4">
            <CalendarDays className="w-12 h-12 text-muted mx-auto mb-3" />
            <p className="text-muted-foreground font-medium text-lg">No events planned</p>
            <p className="text-sm text-muted-foreground mt-1">Click the Add Event button to create one.</p>
          </div>
        ) : view === "grid" ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
            {events.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).map((ev) => (
              <EventCard key={ev.id} ev={ev} onEdit={onEdit} setDeletingId={setDeletingId} volunteers={volunteers} />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-1">
              <div className="bg-card rounded-2xl p-4 sm:p-6 border border-border/50 shadow-lg shadow-black/5 sticky top-24">
                <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
                  <CalendarIcon className="w-5 h-5 text-primary" /> Select Date
                </h3>
                <Calendar 
                  mode="single"
                  selected={selectedDate}
                  onSelect={(date) => {
                    setSelectedDate(date);
                    if (date) {
                      const hasEvent = events?.some(ev => isSameDay(new Date(ev.date), date));
                      if (!hasEvent) {
                        setPromptDate(date);
                        setShowAddPrompt(true);
                      }
                    }
                  }}
                  className="rounded-md border border-border/50 mx-auto"
                  modifiers={{ event: eventDays }}
                  modifiersClassNames={{ event: "bg-primary/20 font-bold text-primary" }}
                />
              </div>
            </div>
            
            <div className="lg:col-span-2 space-y-6">
              <div className="flex items-center justify-between px-1">
                <h3 className="font-bold text-lg md:text-xl text-foreground">
                  {selectedDate ? format(selectedDate, 'MMMM d, yyyy') : 'All Events'}
                </h3>
                <span className="text-xs md:text-sm text-muted-foreground">{filteredEvents.length} events</span>
              </div>
              
              {filteredEvents.length === 0 ? (
                <div className="py-12 text-center bg-muted/20 rounded-2xl border border-dashed border-border/50 px-4">
                  <p className="text-muted-foreground text-sm text-balance">No events scheduled for this day</p>
                  <Button 
                    variant="outline" 
                    className="mt-4 rounded-xl"
                    onClick={() => {
                      if (selectedDate) {
                        const dateWithTime = new Date(selectedDate);
                        dateWithTime.setHours(9, 0, 0, 0);
                        form.reset({
                          name: "",
                          type: EVENT_TYPES[0],
                          date: dateWithTime,
                          description: "",
                          venue: "",
                          speaker: "",
                          endTime: addHours(dateWithTime, 1)
                        });
                        setIsAddOpen(true);
                      }
                    }}
                  >
                    <Plus className="w-4 h-4 mr-2" /> Create Event
                  </Button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                  {filteredEvents.map((ev) => (
                    <EventCard key={ev.id} ev={ev} onEdit={onEdit} setDeletingId={setDeletingId} volunteers={volunteers} />
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Printable Annual Planning Calendar - Landscape A4 */}
        <div className="print-only hidden">
          <div
            ref={printRef}
            className="p-6 sm:p-10 bg-white text-black w-full font-sans print-container"
            style={{ printColorAdjust: 'exact', WebkitPrintColorAdjust: 'exact' }}
          >
            <style>{`
              @page {
                size: landscape A4;
                margin: 12mm;
                margin-top: 40mm;
                margin-bottom: 25mm;
              }
              @media print {
                * {
                  print-color-adjust: exact !important;
                  -webkit-print-color-adjust: exact !important;
                }
                body { background: white !important; margin: 0; padding: 0; }
                .pta-print-header {
                  position: fixed;
                  top: 0;
                  left: 12mm;
                  right: 12mm;
                  height: 28mm;
                  background: white;
                  z-index: 10;
                }
                .pta-print-footer {
                  position: fixed;
                  bottom: 0;
                  left: 12mm;
                  right: 12mm;
                  height: 13mm;
                }
              }
              .planning-grid {
                display: grid;
                grid-template-columns: repeat(4, 1fr);
                gap: 12px;
                margin-top: 16px;
              }
              .month-block {
                break-inside: avoid;
                page-break-inside: avoid;
              }
              .month-table {
                width: 100%;
                border-collapse: collapse;
                font-size: 7.5px;
              }
              .month-table thead th {
                background: #111827;
                color: white;
                font-weight: 800;
                text-transform: uppercase;
                letter-spacing: 0.05em;
                padding: 3px 4px;
                text-align: left;
                font-size: 7px;
              }
              .month-table tbody tr {
                border-bottom: 1px solid #e5e7eb;
              }
              .month-table tbody tr:nth-child(odd) {
                background: #f9fafb;
              }
              .month-table td {
                padding: 3px 4px;
                vertical-align: top;
              }
              .type-dot {
                display: inline-block;
                width: 8px;
                height: 8px;
                border-radius: 50%;
                margin-right: 3px;
                vertical-align: middle;
              }
              .type-badge {
                display: inline-block;
                padding: 1px 4px;
                border-radius: 2px;
                font-weight: 700;
                font-size: 6.5px;
                text-transform: uppercase;
                letter-spacing: 0.04em;
              }
            `}</style>

            {/* ── Content ── */}
            <div className="print-content">
            {/* ── Header (repeats on every printed page) ── */}
            <div className="pta-print-header flex justify-between items-end mb-4 border-b border-gray-200 pb-2">
              <div className="flex items-end gap-4">
                <img src="/smile-club-logo.png" alt="Smile Club Mahajanga" className="w-16 h-16 object-contain flex-shrink-0" />
                <div>
                  <h1 className="text-2xl font-black tracking-tight uppercase text-black leading-none">Plan de Travail Annuel</h1>
                  <p className="text-[9px] text-gray-600 font-bold uppercase tracking-wider mt-1">Smile Club Mahajanga • Medical Outreach Organization</p>
                </div>
              </div>
              <div className="text-right">
                <div className="text-4xl font-black text-black leading-none">{ptaStartYear} – {ptaEndYear}</div>
                <div className="text-[7px] font-bold uppercase tracking-widest text-gray-500 mt-1">July → June • Official Document</div>
              </div>
            </div>

            {/* ── Summary + Legend Bar ── */}
            <div className="flex items-center justify-between mb-4 px-1">
              <div className="flex items-center gap-4 text-[9px] font-semibold text-gray-700">
                <span>Total Events: <strong className="text-black">{ptaEvents.length}</strong></span>
                <span>Active Months: <strong className="text-black">{Object.keys(eventsByMonth).length}</strong></span>
              </div>

              {/* Color Legend */}
              <div className="flex flex-wrap gap-2 text-[7px] font-bold uppercase tracking-tight">
                {EVENT_TYPES.map(type => (
                  <span key={type} className="flex items-center gap-1">
                    <span className="type-dot" style={{ backgroundColor: getEventColorPrint(type) }} />
                    {type}
                  </span>
                ))}
              </div>
            </div>

            {/* ── 4-Column Monthly Grid ── */}
            <div className="planning-grid">
              {months.map((month) => {
                // Build the "YYYY-MM" key for this PTA month
                const monthIdx = new Date(`${month} 1, 2000`).getMonth(); // 0-indexed
                const year = monthIdx >= 6 ? ptaStartYear : ptaEndYear;
                const key = `${year}-${String(monthIdx + 1).padStart(2, '0')}`;

                const monthEvents = (eventsByMonth[key] || []).sort(
                  (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
                );

                return (
                  <div key={key} className="month-block">
                    {/* Month Header */}
                    <div className="flex items-center justify-between mb-1 pb-1 border-b border-gray-300">
                      <h3 className="text-[10px] font-black uppercase tracking-tight text-black">
                        {month.slice(0, 3)} <span className="text-gray-400 font-bold">{String(year).slice(2)}</span>
                      </h3>
                      <span className="text-[7px] font-bold text-gray-500">{monthEvents.length}</span>
                    </div>

                    {monthEvents.length > 0 ? (
                      <table className="month-table">
                        <thead>
                          <tr>
                            <th style={{ width: '22px' }}>Day</th>
                            <th>Event</th>
                          </tr>
                        </thead>
                        <tbody>
                          {monthEvents.map((ev) => {
                            const screenColor = getEventColorScreen(ev.type);
                            return (
                              <tr key={ev.id}>
                                <td className="font-bold text-[8px] text-gray-500 tabular-nums">
                                  {format(new Date(ev.date), 'dd')}
                                </td>
                                <td>
                                  {/* Event Name */}
                                  <div className="font-bold text-black text-[8px] leading-tight mb-0.5 truncate">
                                    {ev.name}
                                  </div>
                                  {/* Type Badge + Details */}
                                  <div className="flex items-center gap-1 text-[7px] text-gray-500 font-semibold">
                                    <span
                                      className="type-badge"
                                      style={{ backgroundColor: screenColor.bg, color: screenColor.fg }}
                                    >
                                      {ev.type}
                                    </span>
                                    <span>{format(new Date(ev.date), 'h:mm a')}</span>
                                  </div>
                                  {/* Venue */}
                                  {ev.venue && (
                                    <div className="text-[7px] text-gray-400 truncate mt-0.5">📍 {ev.venue}</div>
                                  )}
                                  {/* Speaker */}
                                  {ev.speaker && (
                                    <div className="text-[7px] text-gray-400 italic truncate mt-0.5">🎤 {ev.speaker}</div>
                                  )}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    ) : (
                      <div className="py-4 text-center text-[7px] text-gray-400 italic border border-gray-200 rounded">
                        No events
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* ── Footer (repeats on every printed page) ── */}
            <div className="pta-print-footer flex justify-between items-end text-[7px] text-gray-500">
              <div>
                <p>Generated {format(new Date(), 'MMMM d, yyyy HH:mm')}</p>
                <p className="text-gray-400">Smile Club Mahajanga Tracker System</p>
              </div>
              <div className="text-right font-bold text-black">
                <p className="text-[9px] font-black">"For The Patients!"</p>
                <p className="text-gray-500">Medical Outreach Organization</p>
              </div>
            </div>
            </div>
          </div>
        </div>

        <div className="no-print">
          <AlertDialog open={showAddPrompt} onOpenChange={setShowAddPrompt}>
            <AlertDialogContent className="rounded-2xl w-[95vw]">
              <AlertDialogHeader>
                <AlertDialogTitle>No event on this date</AlertDialogTitle>
                <AlertDialogDescription>
                  Would you like to add a new event for {promptDate ? format(promptDate, 'MMMM d, yyyy') : ''}?
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter className="flex flex-col gap-2">
                <AlertDialogCancel className="rounded-xl mt-0">No, thanks</AlertDialogCancel>
                <AlertDialogAction 
                  className="bg-primary text-white hover:bg-primary/90 rounded-xl"
                  onClick={() => {
                    if (promptDate) {
                      const dateWithTime = new Date(promptDate);
                      dateWithTime.setHours(9, 0, 0, 0);
                      form.reset({
                        name: "",
                        type: EVENT_TYPES[0],
                        date: dateWithTime,
                        description: "",
                        venue: "",
                        speaker: "",
                        endTime: addHours(dateWithTime, 1)
                      });
                      setIsAddOpen(true);
                    }
                  }}
                >
                  Yes, Add Event
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>
    </Layout>
  );
}

function EventCard({ ev, onEdit, setDeletingId, volunteers }: { ev: Event, onEdit: (ev: Event) => void, setDeletingId: (id: number) => void, volunteers?: any[] }) {
  const isPast = new Date(ev.date) < new Date();
  const isVolunteerSpeaker = volunteers?.some(v => v.fullName === ev.speaker);
  
  return (
    <div className={`
      bg-card rounded-2xl p-4 sm:p-6 shadow-lg shadow-black/5 border transition-all duration-300 relative group
      ${isPast ? 'border-border/40 opacity-80 hover:opacity-100' : 'border-border/80 hover:border-primary/30 hover:shadow-xl hover:-translate-y-1'}
    `}>
      <div className="absolute top-4 right-4 z-10">
         <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8 bg-background/50 backdrop-blur-sm hover:bg-muted rounded-lg"><MoreVertical className="w-4 h-4" /></Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="rounded-xl shadow-xl min-w-[140px]">
            <DropdownMenuItem className="gap-2 py-2.5 cursor-pointer" onClick={() => onEdit(ev)}>
              <Edit2 className="w-4 h-4" /> Edit
            </DropdownMenuItem>
            <DropdownMenuItem className="gap-2 py-2.5 text-destructive focus:text-destructive cursor-pointer" onClick={() => setDeletingId(ev.id)}>
              <Trash2 className="w-4 h-4" /> Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      
      <div className="flex items-start gap-4 mb-4">
        <div className={`
          flex flex-col items-center justify-center min-w-[54px] h-[54px] sm:min-w-[60px] sm:h-[60px] rounded-xl text-center
          ${isPast ? 'bg-muted text-muted-foreground' : 'bg-primary/10 text-primary'}
        `}>
          <span className="text-[10px] sm:text-xs font-bold uppercase leading-none mb-1">{format(new Date(ev.date), 'MMM')}</span>
          <span className="text-lg sm:text-xl font-display font-bold leading-none">{format(new Date(ev.date), 'dd')}</span>
        </div>
        <div className="flex-1 pr-6 min-w-0">
          <h3 className="font-bold text-base sm:text-lg text-foreground line-clamp-1" title={ev.name}>{ev.name}</h3>
          <span
            className="inline-flex items-center px-2 py-0.5 rounded text-[9px] sm:text-[10px] font-bold uppercase tracking-wider mt-1"
            style={{ backgroundColor: getEventColorScreen(ev.type).bg, color: getEventColorScreen(ev.type).fg }}
          >
            {ev.type}
          </span>
        </div>
      </div>
      
      <div className="space-y-2 text-xs sm:text-sm text-muted-foreground">
        <div className="flex items-center gap-2">
          <CalendarDays className="w-4 h-4 text-primary/70 shrink-0" />
          <span className="font-medium text-foreground/80 truncate">
            {format(new Date(ev.date), 'h:mm a')}
            {ev.endTime && ` - ${format(new Date(ev.endTime), 'h:mm a')}`}
          </span>
        </div>
        
        {ev.venue && (
          <div className="flex items-center gap-2">
            <MapPin className="w-4 h-4 text-primary/70 shrink-0" />
            <span className="truncate">{ev.venue}</span>
          </div>
        )}

        {ev.speaker && (
          <div className="flex items-center gap-2">
            <User className={cn("w-4 h-4 shrink-0", isVolunteerSpeaker ? "text-primary" : "text-primary/70")} />
            <span className={cn("truncate", isVolunteerSpeaker && "font-bold text-foreground/90")}>
              {ev.speaker}
            </span>
          </div>
        )}

        {ev.description && (
          <p className="line-clamp-2 mt-3 pt-3 border-t border-border/50 text-foreground/80 text-xs italic">
            "{ev.description}"
          </p>
        )}
      </div>
    </div>
  );
}
