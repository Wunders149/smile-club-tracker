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
      major: vol.major || "", position: vol.position, gender: vol.gender || undefined, department: vol.department || "None"
    });
    setEditingVol(vol);
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      // Deleting the current photo if it exists on Supabase
      const currentPhoto = form.getValues("photo");
      if (currentPhoto && currentPhoto.includes('supabase.co')) {
        await deleteVolunteerPhoto(currentPhoto);
      }

      // Compression options
      const options = {
        maxSizeMB: 0.1, // Max 100KB
        maxWidthOrHeight: 800,
        useWebWorker: true,
      };

      toast({ title: "Compressing", description: "Reducing image size for better performance..." });
      const compressedFile = await imageCompression(file, options);
      
      toast({ title: "Uploading", description: "Saving photo to cloud storage..." });
      const publicUrl = await uploadVolunteerPhoto(compressedFile);
      
      form.setValue("photo", publicUrl);
      toast({ title: "Success", description: "Photo uploaded successfully!" });
    } catch (error: any) {
      console.error("Upload error:", error);
      toast({ 
        title: "Upload Failed", 
        description: error.message || "Failed to upload photo. Check your connection.",
        variant: "destructive"
      });
    } finally {
      setIsUploading(false);
    }
  };

  const onSubmit = async (data: FormValues) => {
    if (editingVol) {
      await updateMut.mutateAsync({ id: editingVol.id, ...data });
      setEditingVol(null);
    } else {
      await createMut.mutateAsync(data);
      setIsAddOpen(false);
    }
    form.reset();
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
          <div>
            <h1 className="text-3xl font-display font-bold text-foreground">Volunteers</h1>
            <p className="text-muted-foreground mt-1">Manage the amazing team behind Smile Club.</p>
          </div>
          
          <div className="flex items-center gap-3">
            <div className="relative w-64 hidden md:block">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input 
                placeholder="Search volunteers..." 
                className="pl-9 rounded-xl border-border/50 bg-card focus:ring-primary/20"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            <Dialog open={isAddOpen} onOpenChange={(open) => {
              setIsAddOpen(open);
              if (!open) form.reset();
            }}>
              <DialogTrigger asChild>
                <Button className="bg-primary hover:bg-primary/90 text-white font-medium rounded-xl shadow-lg shadow-primary/20 transition-all hover:scale-105 active:scale-95 px-6">
                  <Plus className="w-4 h-4 mr-2" /> Add Volunteer
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[600px] bg-card rounded-2xl max-h-[90vh] overflow-y-auto">
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
                          <FormLabel>Department (for Organigram)</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value || "None"}>
                            <FormControl><SelectTrigger className="rounded-xl"><SelectValue placeholder="Select department" /></SelectTrigger></FormControl>
                            <SelectContent>{DEPARTMENTS.map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}</SelectContent>
                          </Select>
                          <FormMessage/>
                        </FormItem>
                      )} />
                      
                      <FormField control={form.control} name="photo" render={({ field }) => (
                        <FormItem>
                          <FormLabel>Profile Photo</FormLabel>
                          <FormControl>
                            <div className="flex flex-col gap-3">
                              <div className="flex items-center gap-3">
                                {field.value ? (
                                  <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-primary/20">
                                    <img src={field.value} alt="Preview" className="w-full h-full object-cover" />
                                  </div>
                                ) : (
                                  <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center text-muted-foreground">
                                    <Users className="w-6 h-6" />
                                  </div>
                                )}
                                <Button 
                                  type="button" 
                                  variant="outline" 
                                  className="rounded-xl border-dashed"
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
                        <FormItem><FormLabel>Study Field (optional)</FormLabel><FormControl><Input placeholder="Medicine, IT..." className="rounded-xl" {...field} value={field.value || ''} /></FormControl><FormMessage/></FormItem>
                      )} />
                      <FormField control={form.control} name="major" render={({ field }) => (
                        <FormItem><FormLabel>Major (optional)</FormLabel><FormControl><Input placeholder="Surgery, Software..." className="rounded-xl" {...field} value={field.value || ''}/></FormControl><FormMessage/></FormItem>
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
                      <Button type="submit" disabled={createMut.isPending || isUploading} className="rounded-xl px-8 w-full sm:w-auto">
                        {createMut.isPending ? "Creating..." : "Save Volunteer"}
                      </Button>
                    </DialogFooter>
                  </form>
                </Form>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        <div className="md:hidden">
          <div className="relative w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input 
              placeholder="Search volunteers..." 
              className="pl-9 rounded-xl border-border/50 bg-card"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        <div className="bg-card rounded-3xl border border-border/50 shadow-xl overflow-hidden">
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

        {/* Edit Dialog */}
        <Dialog open={!!editingVol} onOpenChange={(open) => { if (!open) setEditingVol(null); }}>
           <DialogContent className="sm:max-w-[600px] bg-card rounded-2xl max-h-[90vh] overflow-y-auto">
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
                    <FormItem>
                      <FormLabel>Profile Photo</FormLabel>
                      <FormControl>
                        <div className="flex flex-col gap-3">
                          <div className="flex items-center gap-3">
                            {field.value ? (
                              <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-primary/20">
                                <img src={field.value} alt="Preview" className="w-full h-full object-cover" />
                              </div>
                            ) : (
                              <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center text-muted-foreground">
                                <Users className="w-6 h-6" />
                              </div>
                            )}
                            <Button 
                              type="button" 
                              variant="outline" 
                              className="rounded-xl border-dashed"
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
                  <Button type="submit" disabled={updateMut.isPending || isUploading} className="rounded-xl px-8 w-full sm:w-auto">
                    {updateMut.isPending ? "Saving..." : "Update Details"}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>

        <AlertDialog open={!!deletingId} onOpenChange={(open) => { if (!open) setDeletingId(null); }}>
          <AlertDialogContent className="rounded-2xl">
            <AlertDialogHeader>
              <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
              <AlertDialogDescription>
                This action cannot be undone. This will permanently delete the volunteer and remove their attendance records.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel className="rounded-xl">Cancel</AlertDialogCancel>
              <button
                className="inline-flex items-center justify-center rounded-xl px-4 py-2 text-sm font-medium bg-destructive text-destructive-foreground hover:bg-destructive/90"
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
              </button>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </Layout>
  );
}
