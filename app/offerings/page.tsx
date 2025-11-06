'use client';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { trpc } from "@/lib/trpc";
import { DollarSign, Plus, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { useState } from "react";
import { ImageUpload } from "@/components/ImageUpload";
import { CardSkeleton } from "@/components/Skeletons";

export default function Offerings() {
  const { data: offerings, isLoading } = trpc.offerings.list.useQuery();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingOffering, setEditingOffering] = useState<Offering | null>(null);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Offerings</h1>
          <p className="text-muted-foreground">Manage your tours, activities, and services</p>
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <CardSkeleton key={i} />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Offerings</h1>
          <p className="text-muted-foreground">Manage your tours, activities, and services</p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Add Offering
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Create New Offering</DialogTitle>
              <DialogDescription>
                Add a new tour, activity, or service for customers to book
              </DialogDescription>
            </DialogHeader>
            <OfferingForm onSuccess={() => setIsCreateDialogOpen(false)} />
          </DialogContent>
        </Dialog>
      </div>

      {offerings?.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Plus className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No offerings yet</h3>
            <p className="text-sm text-muted-foreground text-center max-w-sm mb-4">
              Create your first offering to start accepting bookings
            </p>
            <Button onClick={() => setIsCreateDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Add Your First Offering
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {offerings?.map((offering) => (
            <OfferingCard 
              key={offering.id} 
              offering={offering}
              onEdit={() => setEditingOffering(offering)}
            />
          ))}
        </div>
      )}

      {/* Edit Dialog */}
      <Dialog open={!!editingOffering} onOpenChange={() => setEditingOffering(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Offering</DialogTitle>
            <DialogDescription>Update your offering details</DialogDescription>
          </DialogHeader>
          {editingOffering && (
            <OfferingForm 
              offering={editingOffering}
              onSuccess={() => setEditingOffering(null)}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function OfferingTypeSelect({ initialValue }: { initialValue?: string | null }) {
  const [value, setValue] = useState(initialValue || "");

  return (
    <div>
      <Select value={value} onValueChange={(v) => setValue(v)}>
        <SelectTrigger className="w-full">
          <SelectValue>{value ? value : <span className="text-muted-foreground">Select a type...</span>}</SelectValue>
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="tour">Tour</SelectItem>
          <SelectItem value="activity">Activity</SelectItem>
          <SelectItem value="accommodation">Accommodation</SelectItem>
          <SelectItem value="rental">Rental</SelectItem>
          <SelectItem value="experience">Experience</SelectItem>
          <SelectItem value="other">Other</SelectItem>
        </SelectContent>
      </Select>
      <input type="hidden" name="type" value={value} />
    </div>
  );
}

function OfferingCard({ offering, onEdit }: { offering: Offering; onEdit: () => void }) {
  const utils = trpc.useUtils();
  
  const deleteOfferingMutation = trpc.offerings.delete.useMutation({
    onSuccess: () => {
      toast.success("Offering deleted successfully");
      utils.offerings.list.invalidate();
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const toggleActiveMutation = trpc.offerings.update.useMutation({
    onSuccess: () => {
      toast.success(offering.active ? "Offering deactivated" : "Offering activated");
      utils.offerings.list.invalidate();
    },
  });

  const handleToggleActive = () => {
    const idNumber = Number(offering.id);
    if (Number.isNaN(idNumber)) {
      toast.error("Invalid offering id");
      return;
    }
    toggleActiveMutation.mutate({ id: idNumber, active: !offering.active });
  };

  const handleDelete = () => {
    const idNumber = Number(offering.id);
    if (Number.isNaN(idNumber)) {
      toast.error("Invalid offering id");
      return;
    }
    if (confirm("Are you sure you want to delete this offering?")) {
      deleteOfferingMutation.mutate({ id: idNumber });
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="line-clamp-1">{offering.name}</CardTitle>
            <CardDescription className="line-clamp-2 mt-1">
              {offering.description || "No description"}
            </CardDescription>
          </div>
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
            offering.active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'
          }`}>
            {offering.active ? 'Active' : 'Inactive'}
          </span>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-2 mb-4">
          <div className="flex items-center gap-2 text-sm">
            <DollarSign className="h-4 w-4 text-muted-foreground" />
            <span className="font-medium">${((offering.price ?? 0) / 100).toFixed(2)}</span>
          </div>
        </div>
        <div className="flex gap-2">
          <Button size="sm" variant="outline" onClick={onEdit} className="flex-1">
            <Pencil className="h-3 w-3 mr-1" />
            Edit
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={handleToggleActive}
            disabled={toggleActiveMutation.isPending}
          >
            {offering.active ? 'Deactivate' : 'Activate'}
          </Button>
          <Button
            size="sm"
            variant="destructive"
            onClick={handleDelete}
            disabled={deleteOfferingMutation.isPending}
          >
            <Trash2 className="h-3 w-3" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

type Offering = {
  id?: number | string;
  name?: string;
  description?: string | null;
  type?: 'tour' | 'activity' | 'accommodation' | 'rental' | 'experience' | 'other';
  price?: number;
  durationMinutes?: number | null;
  capacity?: number | null;
  location?: string | null;
  images?: string | null;
  active?: boolean;
}

function OfferingForm({ offering, onSuccess }: { offering?: Offering; onSuccess: () => void }) {
  const utils = trpc.useUtils();
  const [imageUrl, setImageUrl] = useState<string>("");
  
  const createMutation = trpc.offerings.create.useMutation({
    onSuccess: () => {
      toast.success("Offering created successfully");
      utils.offerings.list.invalidate();
      onSuccess();
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const updateMutation = trpc.offerings.update.useMutation({
    onSuccess: () => {
      toast.success("Offering updated successfully");
      utils.offerings.list.invalidate();
      onSuccess();
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    const data = {
      name: formData.get("name") as string,
      description: formData.get("description") as string,
      type: formData.get("type") as "tour" | "activity" | "accommodation" | "rental" | "experience" | "other",
      price: Math.round(parseFloat(formData.get("price") as string) * 100),
      durationMinutes: formData.get("durationMinutes") ? parseInt(formData.get("durationMinutes") as string) : undefined,
      capacity: formData.get("capacity") ? parseInt(formData.get("capacity") as string) : undefined,
      location: formData.get("location") as string || undefined,
      images: imageUrl ? JSON.stringify([imageUrl]) : (offering?.images || undefined),
    };

    if (offering) {
      if (!offering.id) {
        toast.error("Invalid offering id");
        return;
      }
      const idNumber = Number(offering.id);
      if (Number.isNaN(idNumber)) {
        toast.error("Invalid offering id");
        return;
      }
      updateMutation.mutate({ id: idNumber, ...data });
    } else {
      createMutation.mutate(data);
    }
  };

  const isPending = createMutation.isPending || updateMutation.isPending;

  const currentImages: string[] = offering?.images ? JSON.parse(offering.images) as string[] : [];
  const currentImage = currentImages[0] || null;

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <ImageUpload
        currentImage={currentImage}
        onImageChange={setImageUrl}
        label="Offering Image"
      />
      <div>
        <label className="block text-sm font-medium mb-2">Name *</label>
        <Input
          type="text"
          name="name"
          required
          defaultValue={offering?.name}
          className="w-full"
          placeholder="Glacier Hiking Tour"
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-2">Type *</label>
        <OfferingTypeSelect initialValue={offering?.type} />
      </div>

      <div>
        <label className="block text-sm font-medium mb-2">Description</label>
        <Textarea name="description" rows={3} defaultValue={offering?.description ?? undefined} placeholder="Describe your offering..." />
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-2">Price (USD) *</label>
            <Input
              type="number"
              name="price"
              required
              step="0.01"
              min="0"
              defaultValue={offering && typeof offering.price === 'number' ? (offering.price / 100).toFixed(2) : ''}
              className="w-full"
              placeholder="99.99"
            />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Duration (minutes)</label>
            <Input
              type="number"
              name="durationMinutes"
              min="0"
              defaultValue={typeof offering?.durationMinutes === 'number' ? offering.durationMinutes : undefined}
              className="w-full"
              placeholder="120"
            />
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-2">Capacity (people)</label>
            <Input
              type="number"
              name="capacity"
              min="1"
              defaultValue={typeof offering?.capacity === 'number' ? offering.capacity : undefined}
              className="w-full"
              placeholder="10"
            />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Location</label>
            <Input
              type="text"
              name="location"
              defaultValue={offering?.location ?? undefined}
              className="w-full"
              placeholder="Glacier National Park"
            />
        </div>
      </div>

      <div className="flex gap-2 pt-4">
        <Button type="submit" disabled={isPending} className="flex-1">
          {isPending ? "Saving..." : offering ? "Update Offering" : "Create Offering"}
        </Button>
        <Button type="button" variant="outline" onClick={onSuccess}>
          Cancel
        </Button>
      </div>
    </form>
  );
}
