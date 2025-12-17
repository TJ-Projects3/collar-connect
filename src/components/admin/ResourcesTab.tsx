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
import { Plus, Pencil, Trash2 } from "lucide-react";
import { ResourceFormModal } from "./ResourceFormModal";
import { format } from "date-fns";

// Mock data for frontend development
const mockResources = [
  {
    id: "1",
    title: "Senior Software Engineer",
    resource_type: "job" as const,
    description: "Join our diverse team as a senior engineer...",
    content: null,
    company: "TechCorp Inc.",
    location: "San Francisco, CA",
    external_url: "https://example.com/job",
    file_url: null,
    image_url: null,
    tags: ["engineering", "remote"],
    is_published: true,
    is_featured: false,
    view_count: 245,
    created_at: "2024-01-15T10:00:00Z",
  },
  {
    id: "2",
    title: "Building Inclusive Teams",
    resource_type: "article" as const,
    description: "Learn how to build and maintain inclusive teams...",
    content: "Full article content here...",
    company: null,
    location: null,
    external_url: null,
    file_url: null,
    image_url: null,
    tags: ["inclusion", "leadership"],
    is_published: true,
    is_featured: true,
    view_count: 1024,
    created_at: "2024-01-10T14:30:00Z",
  },
  {
    id: "3",
    title: "D&I Workshop Recording",
    resource_type: "video" as const,
    description: "Recording of our latest D&I workshop",
    content: null,
    company: null,
    location: null,
    external_url: "https://youtube.com/watch?v=xxx",
    file_url: null,
    image_url: "https://example.com/thumbnail.jpg",
    tags: ["workshop", "video"],
    is_published: false,
    is_featured: false,
    view_count: 0,
    created_at: "2024-01-20T09:00:00Z",
  },
];

const resourceTypeColors: Record<string, string> = {
  job: "bg-blue-500/10 text-blue-500 border-blue-500/20",
  article: "bg-green-500/10 text-green-500 border-green-500/20",
  video: "bg-purple-500/10 text-purple-500 border-purple-500/20",
  download: "bg-orange-500/10 text-orange-500 border-orange-500/20",
};

export const ResourcesTab = () => {
  const [resources, setResources] = useState(mockResources);
  const [filterType, setFilterType] = useState<string>("all");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingResource, setEditingResource] = useState<typeof mockResources[0] | null>(null);

  const filteredResources = filterType === "all" 
    ? resources 
    : resources.filter(r => r.resource_type === filterType);

  const handleCreate = () => {
    setEditingResource(null);
    setIsModalOpen(true);
  };

  const handleEdit = (resource: typeof mockResources[0]) => {
    setEditingResource(resource);
    setIsModalOpen(true);
  };

  const handleDelete = (id: string) => {
    setResources(resources.filter(r => r.id !== id));
  };

  const handleTogglePublish = (id: string) => {
    setResources(resources.map(r => 
      r.id === id ? { ...r, is_published: !r.is_published } : r
    ));
  };

  const handleSubmit = (data: any) => {
    if (editingResource) {
      setResources(resources.map(r => 
        r.id === editingResource.id ? { ...r, ...data, tags: data.tags?.split(",").map((t: string) => t.trim()) || [] } : r
      ));
    } else {
      const newResource = {
        ...data,
        id: Date.now().toString(),
        tags: data.tags?.split(",").map((t: string) => t.trim()) || [],
        view_count: 0,
        created_at: new Date().toISOString(),
      };
      setResources([newResource, ...resources]);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Select value={filterType} onValueChange={setFilterType}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filter by type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            <SelectItem value="job">Jobs</SelectItem>
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
                    checked={resource.is_published}
                    onCheckedChange={() => handleTogglePublish(resource.id)}
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
