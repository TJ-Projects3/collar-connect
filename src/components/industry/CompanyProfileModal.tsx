import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { COMPANY_SIZE_OPTIONS, useCompany, useSaveCompany } from "@/hooks/useCompany";

// Keep the Space key from scrolling the page behind the dialog.
const stopSpace = (e: React.KeyboardEvent) => {
  if (e.key === " ") e.stopPropagation();
};

interface CompanyProfileModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const CompanyProfileModal = ({ open, onOpenChange }: CompanyProfileModalProps) => {
  const { data: company } = useCompany();
  const saveCompany = useSaveCompany();

  const [name, setName] = useState("");
  const [website, setWebsite] = useState("");
  const [logoUrl, setLogoUrl] = useState("");
  const [industry, setIndustry] = useState("");
  const [companySize, setCompanySize] = useState<string | undefined>(undefined);
  const [description, setDescription] = useState("");

  useEffect(() => {
    if (!open) return;
    setName(company?.name ?? "");
    setWebsite(company?.website ?? "");
    setLogoUrl(company?.logo_url ?? "");
    setIndustry(company?.industry ?? "");
    setCompanySize(company?.company_size ?? undefined);
    setDescription(company?.description ?? "");
  }, [open, company]);

  const handleSave = async () => {
    if (!name.trim()) {
      toast.error("Company name is required");
      return;
    }
    try {
      await saveCompany.mutateAsync({
        name: name.trim(),
        website: website.trim() || null,
        logo_url: logoUrl.trim() || null,
        industry: industry.trim() || null,
        company_size: companySize ?? null,
        description: description.trim() || null,
      });
      toast.success("Company profile saved");
      onOpenChange(false);
    } catch (e: any) {
      toast.error(e?.message || "Failed to save company profile");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Company profile</DialogTitle>
          <DialogDescription>
            Shown on your industry badge and to students you contact. Verification is granted by the
            NextGen Collar team.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="company-name">Company name</Label>
            <Input
              id="company-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDownCapture={stopSpace}
              placeholder="Cloudflare"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="company-website">Website</Label>
            <Input
              id="company-website"
              value={website}
              onChange={(e) => setWebsite(e.target.value)}
              onKeyDownCapture={stopSpace}
              placeholder="https://cloudflare.com"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="company-logo">Logo URL</Label>
            <Input
              id="company-logo"
              value={logoUrl}
              onChange={(e) => setLogoUrl(e.target.value)}
              onKeyDownCapture={stopSpace}
              placeholder="https://..."
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="company-industry">Industry</Label>
              <Input
                id="company-industry"
                value={industry}
                onChange={(e) => setIndustry(e.target.value)}
                onKeyDownCapture={stopSpace}
                placeholder="Cloud infrastructure"
              />
            </div>
            <div className="space-y-2">
              <Label>Company size</Label>
              <Select value={companySize} onValueChange={setCompanySize}>
                <SelectTrigger>
                  <SelectValue placeholder="Select size" />
                </SelectTrigger>
                <SelectContent>
                  {COMPANY_SIZE_OPTIONS.map((size) => (
                    <SelectItem key={size} value={size}>
                      {size} employees
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="company-description">About</Label>
            <Textarea
              id="company-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              onKeyDownCapture={stopSpace}
              rows={4}
              placeholder="What your company does and who you're looking to meet."
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={saveCompany.isPending}>
            {saveCompany.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Save company
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
