import { useMutation } from "@tanstack/react-query";
import { FunctionsHttpError } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export const useDeleteAccount = () => {
  const { toast } = useToast();

  return useMutation({
    mutationFn: async () => {
      const { error } = await supabase.functions.invoke("delete-account", { body: {} });
      if (error) {
        const details =
          error instanceof FunctionsHttpError ? await error.context.text() : error.message;
        throw new Error(details || "Account deletion failed");
      }
      await supabase.auth.signOut();
    },
    onSuccess: () => {
      toast({
        title: "Account deleted",
        description: "Your account and all associated data have been removed.",
      });
      window.location.href = "/";
    },
    onError: (error: Error) => {
      toast({
        title: "Could not delete account",
        description: error.message,
        variant: "destructive",
      });
    },
  });
};
