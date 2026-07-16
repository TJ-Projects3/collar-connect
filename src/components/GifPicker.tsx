import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

interface GifItem {
  id: string | number;
  title: string;
  preview: string;
  url: string;
}

interface GifPickerProps {
  trigger: React.ReactNode;
  onSelect: (url: string) => void;
}

export const GifPicker = ({ trigger, onSelect }: GifPickerProps) => {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [items, setItems] = useState<GifItem[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open) return;
    const controller = new AbortController();
    const t = setTimeout(async () => {
      setLoading(true);
      try {
        const params = new URLSearchParams({
          customer_id: user?.id || "anonymous",
        });
        if (query.trim()) params.set("q", query.trim());
        const { data, error } = await supabase.functions.invoke("klipy-gifs", {
          method: "GET",
          headers: {},
          body: undefined as any,
          // fallback: use fetch below since invoke doesn't support query easily
        } as any);
        // Use direct fetch via functions URL to keep query params:
        const url = `https://sucpuwbwjmxkbqcllfrj.supabase.co/functions/v1/klipy-gifs?${params}`;
        const res = await fetch(url, {
          signal: controller.signal,
          headers: {
            apikey: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN1Y3B1d2J3am14a2JxY2xsZnJqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM0MjgyMDQsImV4cCI6MjA3OTAwNDIwNH0.akhng3iWLO4SZRbErLPLLJN3cf9tsjcGtd5pPfyTh2E",
          },
        });
        const json = await res.json();
        setItems(json.items || []);
      } catch (e) {
        if ((e as any).name !== "AbortError") console.error(e);
      } finally {
        setLoading(false);
      }
    }, 300);
    return () => {
      controller.abort();
      clearTimeout(t);
    };
  }, [open, query, user?.id]);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>{trigger}</PopoverTrigger>
      <PopoverContent className="w-80 p-2" align="start">
        <Input
          placeholder="Search GIFs..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="mb-2 h-8"
        />
        <div className="h-72 overflow-y-auto">
          {loading && items.length === 0 ? (
            <div className="flex h-full items-center justify-center">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          ) : items.length === 0 ? (
            <p className="p-4 text-center text-xs text-muted-foreground">No GIFs found</p>
          ) : (
            <div className="grid grid-cols-2 gap-1">
              {items.map((g) => (
                <button
                  key={g.id}
                  type="button"
                  onClick={() => {
                    onSelect(g.url);
                    setOpen(false);
                    setQuery("");
                  }}
                  className="overflow-hidden rounded-md border border-border hover:ring-2 hover:ring-primary transition"
                >
                  <img src={g.preview} alt={g.title} className="h-full w-full object-cover" loading="lazy" />
                </button>
              ))}
            </div>
          )}
        </div>
        <p className="mt-2 text-[10px] text-muted-foreground text-center">Powered by KLIPY</p>
      </PopoverContent>
    </Popover>
  );
};
