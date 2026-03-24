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
  
  const printRef = useRef<HTMLDivElement>(null);
  const handlePrint = useReactToPrint({
    contentRef: printRef,
    documentTitle: `Annual_Events_${new Date().getFullYear()}`,
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

  const eventsByMonth = events ? [...events].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()).reduce((acc, ev) => {
    const month = format(new Date(ev.date), 'MMMM');
    if (!acc[month]) acc[month] = [];
    acc[month].push(ev);
    return acc;
  }, {} as Record<string, Event[]>) : {};

  const months = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

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

        {/* Printable Annual Calendar */}
        <div className="print-only">
          <div ref={printRef} className="p-0 bg-white text-black w-full font-sans">
            <style>{`
              @page {
                size: landscape;
                margin: 20mm;
              }
              @media print {
                body {
                  print-color-adjust: exact;
                  -webkit-print-color-adjust: exact;
                  background: white !important;
                }
                .annual-grid {
                  display: block;
                  column-count: 2;
                  column-gap: 60px;
                  column-fill: auto;
                  width: 100%;
                  margin-top: 40px;
                }
                .month-section {
                  display: block;
                  width: 100%;
                  break-inside: avoid-column;
                  page-break-inside: avoid;
                  margin-bottom: 40px;
                }
                .month-table {
                  width: 100%;
                  border-collapse: collapse;
                }
                .event-row {
                  border-bottom: 0.5px solid #f0f0f0;
                }
                .event-row:last-child {
                  border-bottom: none;
                }
                .print-header {
                  margin-bottom: 20px;
                  padding-bottom: 30px;
                  border-bottom: 2px solid #000;
                }
              }
            `}</style>
            
            <div className="print-header flex justify-between items-end">
              <div className="flex items-center gap-6">
                <img src="/smile-club-logo.png" alt="Logo" className="h-16 object-contain" />
                <div>
                  <h1 className="text-2xl font-black tracking-tighter uppercase text-gray-900 leading-none mb-1">Activity Calendar</h1>
                  <p className="text-[11px] text-gray-500 font-bold uppercase tracking-[0.2em]">Smile Club Mahajanga</p>
                </div>
              </div>
              <div className="text-right">
                <div className="text-5xl font-black text-gray-900 leading-none">{new Date().getFullYear()}</div>
                <div className="text-[8px] font-bold uppercase tracking-[0.3em] text-primary mt-2">Official Club Document</div>
              </div>
            </div>

            <div className="annual-grid">
              {months.map(month => {
                const monthEvents = eventsByMonth[month] || [];
                if (monthEvents.length === 0) return null;

                return (
                  <div key={month} className="month-section">
                    <div className="flex items-baseline justify-between border-b-2 border-gray-900/10 mb-3 pb-1">
                      <h3 className="text-xl font-black uppercase italic tracking-tighter text-gray-900">{month}</h3>
                      <span className="text-[9px] font-bold uppercase tracking-widest text-gray-400">{monthEvents.length} activities</span>
                    </div>
                    <table className="month-table">
                      <tbody>
                        {monthEvents.map(ev => (
                          <tr key={ev.id} className="event-row">
                            <td className="py-2.5 px-1">
                              <div className="flex items-start gap-4">
                                <div className="text-base font-bold text-primary tabular-nums min-w-[22px]">
                                  {format(new Date(ev.date), 'dd')}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="font-bold text-gray-900 leading-tight mb-1 uppercase text-[11px] truncate">{ev.name}</div>
                                  <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[9px] font-semibold text-gray-500 uppercase tracking-tight">
                                    <span className="text-primary/80 font-bold">{ev.type}</span>
                                    {ev.venue && (
                                      <>
                                        <span className="text-gray-300">•</span>
                                        <span className="truncate max-w-[180px]">{ev.venue}</span>
                                      </>
                                    )}
                                    <span className="text-gray-300">•</span>
                                    <span>{format(new Date(ev.date), 'h:mm a')}</span>
                                  </div>
                                </div>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                );
              })}
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
          <span className="inline-flex items-center px-2 py-0.5 rounded text-[9px] sm:text-[10px] font-bold uppercase tracking-wider bg-secondary/10 text-secondary-foreground mt-1">
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
