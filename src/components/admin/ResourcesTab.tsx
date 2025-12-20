import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, Pencil, Trash2, Loader2 } from "lucide-react";
import { ResourceFormModal } from "./ResourceFormModal";
import { format } from "date-fns";
import { useAdminResources, useCreateResource, useUpdateResource, useDeleteResource, type Resource } from "@/hooks/useAdminResources";

const resourceTypeColors: Record<string, string> = {
  article: "bg-green-500/10 text-green-500 border-green-500/20",
  video: "bg-purple-500/10 text-purple-500 border-purple-500/20",
  download: "bg-orange-500/10 text-orange-500 border-orange-500/20",
};

export const ResourcesTab = () => {
  const { data: allResources = [], isLoading } = useAdminResources();
  const createResource = useCreateResource();
  const updateResource = useUpdateResource();
  const deleteResource = useDeleteResource();

  const [filterType, setFilterType] = useState<string>("all");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingResource, setEditingResource] = useState<Resource | null>(null);

  // Filter out jobs - they're managed in the Jobs tab now
  const resources = allResources.filter(r => r.resource_type !== "job");

  const filteredResources = filterType === "all" 
    ? resources 
    : resources.filter(r => r.resource_type === filterType);

  const handleCreate = () => {
    setEditingResource(null);
    setIsModalOpen(true);
  };

  const handleEdit = (resource: Resource) => {
    setEditingResource(resource);
    setIsModalOpen(true);
  };

  const handleDelete = (id: string) => {
    deleteResource.mutate(id);
  };

  const handleTogglePublish = (resource: Resource) => {
    updateResource.mutate({ id: resource.id, is_published: !resource.is_published });
  };

  const handleSubmit = (data: any) => {
    const resourceData = {
      title: data.title,
      resource_type: data.resource_type,
      description: data.description || null,
      content: data.content || null,
      company: data.company || null,
      location: data.location || null,
      external_url: data.external_url || null,
      file_url: data.file_url || null,
      image_url: data.image_url || null,
      tags: data.tags?.split(",").map((t: string) => t.trim()).filter(Boolean) || null,
      is_published: data.is_published ?? false,
      is_featured: data.is_featured ?? false,
    };

    if (editingResource) {
      updateResource.mutate({ id: editingResource.id, ...resourceData });
    } else {
      createResource.mutate(resourceData);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Select value={filterType} onValueChange={setFilterType}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filter by type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            <SelectItem value="article">Articles</SelectItem>
            <SelectItem value="video">Videos</SelectItem>
            <SelectItem value="download">Downloads</SelectItem>
          </SelectContent>
        </Select>
        <Button onClick={handleCreate}>
          <Plus className="h-4 w-4 mr-2" />
          Create Resource
        </Button>
      </div>

      <div className="rounded-xl border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Title</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Company</TableHead>
              <TableHead className="text-center">Views</TableHead>
              <TableHead className="text-center">Published</TableHead>
              <TableHead>Created</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredResources.map((resource) => (
              <TableRow key={resource.id}>
                <TableCell className="font-medium max-w-[200px] truncate">
                  {resource.title}
                </TableCell>
                <TableCell>
                  <Badge variant="outline" className={resourceTypeColors[resource.resource_type]}>
                    {resource.resource_type}
                  </Badge>
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {resource.company || "—"}
                </TableCell>
                <TableCell className="text-center">{resource.view_count}</TableCell>
                <TableCell className="text-center">
                  <Switch
                    checked={resource.is_published ?? false}
                    onCheckedChange={() => handleTogglePublish(resource)}
                  />
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {format(new Date(resource.created_at), "MMM d, yyyy")}
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
                    <Button variant="ghost" size="icon" onClick={() => handleEdit(resource)}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => handleDelete(resource.id)}>
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
            {filteredResources.length === 0 && (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                  No resources found
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <ResourceFormModal
        resource={editingResource}
        open={isModalOpen}
        onOpenChange={setIsModalOpen}
        onSubmit={handleSubmit}
      />
    </div>
  );
};
