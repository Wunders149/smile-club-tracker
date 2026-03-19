import { useState, useRef } from "react";
import { Layout } from "@/components/Layout";
import { useVolunteers, useCreateVolunteer, useUpdateVolunteer, useDeleteVolunteer } from "@/hooks/use-volunteers";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Plus, MoreVertical, Edit2, Trash2, Mail, Phone, GraduationCap, Users, Upload, Loader2, Search, MapPin } from "lucide-react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertVolunteerSchema, type Volunteer, GENDERS, POSITIONS, DEPARTMENTS } from "@shared/schema";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Card, CardContent } from "@/components/ui/card";
import imageCompression from 'browser-image-compression';
import { uploadVolunteerPhoto, deleteVolunteerPhoto } from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";

type FormValues = z.infer<typeof insertVolunteerSchema>;

export default function Volunteers() {
  const { data: volunteers, isLoading } = useVolunteers();
  const createMut = useCreateVolunteer();
  const updateMut = useUpdateVolunteer();
  const deleteMut = useDeleteVolunteer();
  const { toast } = useToast();

  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editingVol, setEditingVol] = useState<Volunteer | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const form = useForm<FormValues>({
    resolver: zodResolver(insertVolunteerSchema),
    defaultValues: {
      fullName: "", contact: "", address: "", email: "", photo: "", studyField: "", major: "", position: POSITIONS[8], gender: undefined, department: "None"
    }
  });

  const onEdit = (vol: Volunteer) => {
    form.reset({
      fullName: vol.fullName, contact: vol.contact, address: vol.address,
      email: vol.email, photo: vol.photo || "", studyField: vol.studyField || "",
      major: vol.major || "", position: vol.position, gender: (vol.gender as any) || undefined, department: vol.department || "None"
    });
    setEditingVol(vol);
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const currentPhoto = form.getValues("photo");
      if (currentPhoto && currentPhoto.includes('supabase.co')) {
        await deleteVolunteerPhoto(currentPhoto);
      }

      const options = {
        maxSizeMB: 0.1,
        maxWidthOrHeight: 800,
        useWebWorker: true,
      };

      toast({ title: "Compressing", description: "Reducing image size..." });
      const compressedFile = await imageCompression(file, options);
      
      toast({ title: "Uploading", description: "Saving photo..." });
      const publicUrl = await uploadVolunteerPhoto(compressedFile);
      
      form.setValue("photo", publicUrl);
      toast({ title: "Success", description: "Photo uploaded!" });
    } catch (error: any) {
      console.error("Upload error:", error);
      toast({ 
        title: "Upload Failed", 
        description: error.message || "Failed to upload photo.",
        variant: "destructive"
      });
    } finally {
      setIsUploading(false);
    }
  };

  const onSubmit = async (data: FormValues) => {
    try {
      if (editingVol) {
        await updateMut.mutateAsync({ id: editingVol.id, ...data });
        setEditingVol(null);
      } else {
        await createMut.mutateAsync(data);
        setIsAddOpen(false);
      }
      form.reset();
    } catch (err) {
      // Error handled by mutation hooks
    }
  };

  const filteredVolunteers = volunteers?.filter(vol => 
    vol.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    vol.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    vol.position.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (vol.department && vol.department.toLowerCase().includes(searchQuery.toLowerCase()))
  ) || [];

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="text-center sm:text-left">
            <h1 className="text-2xl md:text-3xl font-display font-bold text-foreground">Volunteers</h1>
            <p className="text-muted-foreground mt-1 text-sm">Manage the amazing team behind Smile Club.</p>
          </div>
          
          <div className="flex flex-col sm:flex-row items-center gap-3">
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input 
                placeholder="Search volunteers..." 
                className="pl-9 rounded-xl border-border/50 bg-card focus:ring-primary/20 w-full"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            <Dialog open={isAddOpen} onOpenChange={(open) => {
              setIsAddOpen(open);
              if (!open) form.reset();
            }}>
              <DialogTrigger asChild>
                <Button className="bg-primary hover:bg-primary/90 text-white font-medium rounded-xl shadow-lg shadow-primary/20 transition-all hover:scale-105 active:scale-95 px-6 w-full sm:w-auto">
                  <Plus className="w-4 h-4 mr-2" /> Add Volunteer
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[600px] bg-card rounded-2xl max-h-[90vh] overflow-y-auto w-[95vw]">
                <DialogHeader>
                  <DialogTitle className="font-display text-2xl">Add New Volunteer</DialogTitle>
                </DialogHeader>
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 pt-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField control={form.control} name="fullName" render={({ field }) => (
                        <FormItem><FormLabel>Full Name</FormLabel><FormControl><Input placeholder="John Doe" className="rounded-xl" {...field} /></FormControl><FormMessage/></FormItem>
                      )} />
                      <FormField control={form.control} name="email" render={({ field }) => (
                        <FormItem><FormLabel>Email</FormLabel><FormControl><Input placeholder="john@example.com" type="email" className="rounded-xl" {...field} /></FormControl><FormMessage/></FormItem>
                      )} />
                      <FormField control={form.control} name="contact" render={({ field }) => (
                        <FormItem><FormLabel>Contact Number</FormLabel><FormControl><Input placeholder="+261 34 00 000 00" className="rounded-xl" {...field} /></FormControl><FormMessage/></FormItem>
                      )} />
                      <FormField control={form.control} name="address" render={({ field }) => (
                        <FormItem><FormLabel>Address</FormLabel><FormControl><Input placeholder="Mahajanga" className="rounded-xl" {...field} /></FormControl><FormMessage/></FormItem>
                      )} />
                      <FormField control={form.control} name="position" render={({ field }) => (
                        <FormItem>
                          <FormLabel>Position</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl><SelectTrigger className="rounded-xl"><SelectValue placeholder="Select position" /></SelectTrigger></FormControl>
                            <SelectContent>{POSITIONS.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}</SelectContent>
                          </Select>
                          <FormMessage/>
                        </FormItem>
                      )} />

                      <FormField control={form.control} name="department" render={({ field }) => (
                        <FormItem>
                          <FormLabel>Department</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value || "None"}>
                            <FormControl><SelectTrigger className="rounded-xl"><SelectValue placeholder="Select department" /></SelectTrigger></FormControl>
                            <SelectContent>{DEPARTMENTS.map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}</SelectContent>
                          </Select>
                          <FormMessage/>
                        </FormItem>
                      )} />
                      
                      <FormField control={form.control} name="photo" render={({ field }) => (
                        <FormItem className="md:col-span-2">
                          <FormLabel>Profile Photo</FormLabel>
                          <FormControl>
                            <div className="flex flex-col gap-3">
                              <div className="flex items-center gap-3">
                                {field.value ? (
                                  <div className="w-16 h-16 rounded-2xl overflow-hidden border-2 border-primary/20">
                                    <img src={field.value} alt="Preview" className="w-full h-full object-cover" />
                                  </div>
                                ) : (
                                  <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center text-muted-foreground border-2 border-dashed border-border">
                                    <Users className="w-8 h-8" />
                                  </div>
                                )}
                                <Button 
                                  type="button" 
                                  variant="outline" 
                                  className="rounded-xl border-dashed h-16 flex-1"
                                  disabled={isUploading}
                                  onClick={() => fileInputRef.current?.click()}
                                >
                                  {isUploading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Upload className="w-4 h-4 mr-2" />}
                                  {field.value ? "Change Photo" : "Upload Photo"}
                                </Button>
                                <input 
                                  type="file" 
                                  ref={fileInputRef}
                                  className="hidden" 
                                  accept="image/*"
                                  onChange={handleFileChange}
                                />
                              </div>
                              <input type="hidden" {...field} value={field.value || ''} />
                            </div>
                          </FormControl>
                          <FormMessage/>
                        </FormItem>
                      )} />

                      <FormField control={form.control} name="studyField" render={({ field }) => (
                        <FormItem><FormLabel>Study Field</FormLabel><FormControl><Input placeholder="Medicine, IT..." className="rounded-xl" {...field} value={field.value || ''} /></FormControl><FormMessage/></FormItem>
                      )} />
                      <FormField control={form.control} name="major" render={({ field }) => (
                        <FormItem><FormLabel>Major</FormLabel><FormControl><Input placeholder="Surgery, Software..." className="rounded-xl" {...field} value={field.value || ''}/></FormControl><FormMessage/></FormItem>
                      )} />
                      <FormField control={form.control} name="gender" render={({ field }) => (
                        <FormItem>
                          <FormLabel>Gender</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value || ''}>
                            <FormControl><SelectTrigger className="rounded-xl"><SelectValue placeholder="Select gender" /></SelectTrigger></FormControl>
                            <SelectContent>
                              {GENDERS.map(g => <SelectItem key={g} value={g}>{g}</SelectItem>)}
                            </SelectContent>
                          </Select>
                          <FormMessage/>
                        </FormItem>
                      )} />
                    </div>
                    <DialogFooter className="pt-4">
                      <Button type="submit" disabled={createMut.isPending || isUploading} className="rounded-xl px-8 w-full sm:w-auto h-12">
                        {createMut.isPending ? "Creating..." : "Save Volunteer"}
                      </Button>
                    </DialogFooter>
                  </form>
                </Form>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Desktop Table View */}
        <div className="hidden lg:block bg-card rounded-3xl border border-border/50 shadow-xl overflow-hidden">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-muted/30">
                <TableRow className="hover:bg-transparent border-border/50">
                  <TableHead className="w-[300px] font-bold text-foreground uppercase text-xs tracking-wider">Volunteer</TableHead>
                  <TableHead className="font-bold text-foreground uppercase text-xs tracking-wider">Contact & Location</TableHead>
                  <TableHead className="font-bold text-foreground uppercase text-xs tracking-wider">Position</TableHead>
                  <TableHead className="w-[100px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow><TableCell colSpan={4} className="text-center py-12 text-muted-foreground italic">Loading volunteers...</TableCell></TableRow>
                ) : filteredVolunteers.length === 0 ? (
                  <TableRow><TableCell colSpan={4} className="text-center py-16 text-muted-foreground italic">
                    <div className="flex flex-col items-center gap-2">
                      <Users className="w-8 h-8 opacity-20" />
                      No volunteers found
                    </div>
                  </TableCell></TableRow>
                ) : (
                  filteredVolunteers.map((vol) => (
                    <TableRow key={vol.id} className="hover:bg-muted/5 border-border/50 transition-colors group">
                      <TableCell>
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center font-bold text-primary text-xl overflow-hidden shadow-sm group-hover:shadow-md transition-all">
                            {vol.photo ? <img src={vol.photo} alt={vol.fullName} className="w-full h-full object-cover" /> : vol.fullName.charAt(0)}
                          </div>
                          <div>
                            <p className="font-bold text-foreground">{vol.fullName}</p>
                            <p className="text-xs text-muted-foreground flex items-center gap-1">
                              <GraduationCap className="w-3 h-3" />
                              {vol.studyField} {vol.major && `• ${vol.major}`}
                            </p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <p className="text-sm flex items-center gap-2 text-muted-foreground group-hover:text-foreground transition-colors"><Mail className="w-3.5 h-3.5 text-primary/60" /> {vol.email}</p>
                          <p className="text-sm flex items-center gap-2 text-muted-foreground group-hover:text-foreground transition-colors"><Phone className="w-3.5 h-3.5 text-primary/60" /> {vol.contact}</p>
                          <p className="text-sm flex items-center gap-2 text-muted-foreground group-hover:text-foreground transition-colors"><MapPin className="w-3.5 h-3.5 text-primary/60" /> {vol.address}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="px-3 py-1 rounded-full bg-secondary/10 text-secondary-foreground text-xs font-bold uppercase tracking-wider border border-secondary/20">
                          {vol.position}
                        </span>
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="rounded-xl hover:bg-muted group-hover:bg-muted"><MoreVertical className="w-4 h-4" /></Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="rounded-xl shadow-xl">
                            <DropdownMenuItem className="gap-2 cursor-pointer" onClick={() => onEdit(vol)}>
                              <Edit2 className="w-4 h-4" /> Edit Profile
                            </DropdownMenuItem>
                            <DropdownMenuItem className="gap-2 text-destructive focus:text-destructive cursor-pointer" onClick={() => setDeletingId(vol.id)}>
                              <Trash2 className="w-4 h-4" /> Delete Volunteer
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </div>

        {/* Mobile/Tablet Card View */}
        <div className="lg:hidden space-y-4">
          {isLoading ? (
            <div className="text-center py-12 text-muted-foreground italic">Loading volunteers...</div>
          ) : filteredVolunteers.length === 0 ? (
            <div className="text-center py-16 bg-card rounded-3xl border border-border/50 italic">
              <div className="flex flex-col items-center gap-2">
                <Users className="w-8 h-8 opacity-20" />
                No volunteers found
              </div>
            </div>
          ) : (
            filteredVolunteers.map((vol) => (
              <Card key={vol.id} className="rounded-2xl border-border/50 shadow-sm overflow-hidden active:scale-[0.98] transition-all">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center font-bold text-primary text-2xl overflow-hidden shadow-sm">
                        {vol.photo ? <img src={vol.photo} alt={vol.fullName} className="w-full h-full object-cover" /> : vol.fullName.charAt(0)}
                      </div>
                      <div>
                        <p className="font-bold text-foreground text-lg leading-tight">{vol.fullName}</p>
                        <div className="flex flex-wrap gap-2 mt-1">
                          <span className="px-2 py-0.5 rounded-full bg-secondary/10 text-secondary-foreground text-[10px] font-bold uppercase tracking-wider border border-secondary/20">
                            {vol.position}
                          </span>
                          {vol.department && vol.department !== "None" && (
                            <span className="px-2 py-0.5 rounded-full bg-primary/5 text-primary text-[10px] font-bold border border-primary/10">
                              {vol.department}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-10 w-10 rounded-xl bg-muted/50"><MoreVertical className="w-5 h-5" /></Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="rounded-xl shadow-xl min-w-[160px]">
                        <DropdownMenuItem className="gap-3 py-3 cursor-pointer" onClick={() => onEdit(vol)}>
                          <Edit2 className="w-4 h-4" /> Edit Profile
                        </DropdownMenuItem>
                        <DropdownMenuItem className="gap-3 py-3 text-destructive focus:text-destructive cursor-pointer" onClick={() => setDeletingId(vol.id)}>
                          <Trash2 className="w-4 h-4" /> Delete Volunteer
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                  
                  <div className="mt-4 grid grid-cols-1 gap-3 pt-4 border-t border-border/10">
                    <div className="flex items-center gap-3 text-sm text-muted-foreground bg-muted/20 p-2 rounded-xl">
                      <Phone className="w-4 h-4 text-primary/60" />
                      <span className="font-medium text-foreground">{vol.contact}</span>
                    </div>
                    <div className="flex items-center gap-3 text-sm text-muted-foreground p-2">
                      <Mail className="w-4 h-4 text-primary/60" />
                      <span className="truncate">{vol.email}</span>
                    </div>
                    <div className="flex items-center gap-3 text-sm text-muted-foreground p-2">
                      <MapPin className="w-4 h-4 text-primary/60" />
                      <span className="truncate">{vol.address}</span>
                    </div>
                    {vol.studyField && (
                      <div className="flex items-center gap-3 text-sm text-muted-foreground p-2">
                        <GraduationCap className="w-4 h-4 text-primary/60" />
                        <span className="truncate">{vol.studyField} {vol.major && `• ${vol.major}`}</span>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )
          ))}
        </div>

        {/* Edit Dialog */}
        <Dialog open={!!editingVol} onOpenChange={(open) => { if (!open) setEditingVol(null); }}>
           <DialogContent className="sm:max-w-[600px] bg-card rounded-2xl max-h-[90vh] overflow-y-auto w-[95vw]">
            <DialogHeader>
              <DialogTitle className="font-display text-2xl">Edit Volunteer</DialogTitle>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 pt-4">
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField control={form.control} name="fullName" render={({ field }) => (
                    <FormItem><FormLabel>Full Name</FormLabel><FormControl><Input className="rounded-xl" {...field} /></FormControl><FormMessage/></FormItem>
                  )} />
                  <FormField control={form.control} name="email" render={({ field }) => (
                    <FormItem><FormLabel>Email</FormLabel><FormControl><Input type="email" className="rounded-xl" {...field} /></FormControl><FormMessage/></FormItem>
                  )} />
                  <FormField control={form.control} name="contact" render={({ field }) => (
                    <FormItem><FormLabel>Contact</FormLabel><FormControl><Input className="rounded-xl" {...field} /></FormControl><FormMessage/></FormItem>
                  )} />
                  <FormField control={form.control} name="address" render={({ field }) => (
                    <FormItem><FormLabel>Address</FormLabel><FormControl><Input className="rounded-xl" {...field} /></FormControl><FormMessage/></FormItem>
                  )} />
                  <FormField control={form.control} name="position" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Position</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl><SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger></FormControl>
                        <SelectContent>{POSITIONS.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}</SelectContent>
                      </Select>
                      <FormMessage/>
                    </FormItem>
                  )} />

                  <FormField control={form.control} name="department" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Department</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value || "None"}>
                        <FormControl><SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger></FormControl>
                        <SelectContent>{DEPARTMENTS.map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}</SelectContent>
                      </Select>
                      <FormMessage/>
                    </FormItem>
                  )} />
                  
                  <FormField control={form.control} name="photo" render={({ field }) => (
                    <FormItem className="md:col-span-2">
                      <FormLabel>Profile Photo</FormLabel>
                      <FormControl>
                        <div className="flex flex-col gap-3">
                          <div className="flex items-center gap-3">
                            {field.value ? (
                              <div className="w-16 h-16 rounded-2xl overflow-hidden border-2 border-primary/20">
                                <img src={field.value} alt="Preview" className="w-full h-full object-cover" />
                              </div>
                            ) : (
                              <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center text-muted-foreground border-2 border-dashed border-border">
                                <Users className="w-8 h-8" />
                              </div>
                            )}
                            <Button 
                              type="button" 
                              variant="outline" 
                              className="rounded-xl border-dashed h-16 flex-1"
                              disabled={isUploading}
                              onClick={() => fileInputRef.current?.click()}
                            >
                              {isUploading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Upload className="w-4 h-4 mr-2" />}
                              {field.value ? "Change Photo" : "Upload Photo"}
                            </Button>
                            <input 
                              type="file" 
                              ref={fileInputRef}
                              className="hidden" 
                              accept="image/*"
                              onChange={handleFileChange}
                            />
                          </div>
                          <input type="hidden" {...field} value={field.value || ''} />
                        </div>
                      </FormControl>
                      <FormMessage/>
                    </FormItem>
                  )} />

                  <FormField control={form.control} name="studyField" render={({ field }) => (
                    <FormItem><FormLabel>Study Field</FormLabel><FormControl><Input className="rounded-xl" {...field} value={field.value || ''}/></FormControl><FormMessage/></FormItem>
                  )} />
                  <FormField control={form.control} name="major" render={({ field }) => (
                    <FormItem><FormLabel>Major</FormLabel><FormControl><Input className="rounded-xl" {...field} value={field.value || ''}/></FormControl><FormMessage/></FormItem>
                  )} />
                  <FormField control={form.control} name="gender" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Gender</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value || ''}>
                        <FormControl><SelectTrigger className="rounded-xl"><SelectValue placeholder="Select gender" /></SelectTrigger></FormControl>
                        <SelectContent>
                          {GENDERS.map(g => <SelectItem key={g} value={g}>{g}</SelectItem>)}
                        </SelectContent>
                      </Select>
                      <FormMessage/>
                    </FormItem>
                  )} />
                </div>
                <DialogFooter className="pt-4">
                  <Button type="submit" disabled={updateMut.isPending || isUploading} className="rounded-xl px-8 w-full sm:w-auto h-12">
                    {updateMut.isPending ? "Saving..." : "Update Details"}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>

        <AlertDialog open={!!deletingId} onOpenChange={(open) => { if (!open) setDeletingId(null); }}>
          <AlertDialogContent className="rounded-2xl w-[95vw]">
            <AlertDialogHeader>
              <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
              <AlertDialogDescription>
                This action cannot be undone. This will permanently delete the volunteer and remove their attendance records.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter className="flex flex-col gap-2">
              <AlertDialogCancel className="rounded-xl mt-0">Cancel</AlertDialogCancel>
              <AlertDialogAction
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90 rounded-xl"
                onClick={async () => {
                  if (deletingId) {
                    const volunteerToDelete = volunteers?.find(v => v.id === deletingId);
                    if (volunteerToDelete?.photo && volunteerToDelete.photo.includes('supabase.co')) {
                      await deleteVolunteerPhoto(volunteerToDelete.photo);
                    }
                    await deleteMut.mutateAsync(deletingId);
                  }
                  setDeletingId(null);
                }}
              >
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </Layout>
  );
}
