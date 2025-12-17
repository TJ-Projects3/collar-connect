import { useState, useRef, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from "@/components/ui/dialog";
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Edit, Camera, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useProfile, useUpdateProfile, useUploadAvatar } from "@/hooks/useProfile";

const profileSchema = z.object({
    full_name: z.string().min(1, "Full name is required").max(100, "Name must be less than 100 characters"),
    job_title: z.string().max(100, "Job title must be less than 100 characters").optional().or(z.literal("")),
    company: z.string().max(100, "Company must be less than 100 characters").optional().or(z.literal("")),
    location: z.string().max(100, "Location must be less than 100 characters").optional().or(z.literal("")),
    bio: z.string().max(500, "Bio must be less than 500 characters").optional().or(z.literal("")),
    website: z.string().url("Please enter a valid URL").optional().or(z.literal("")),
});

type ProfileFormData = z.infer<typeof profileSchema>;

export const ProfileButton = () => {
    const [open, setOpen] = useState(false);
    const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
    const [avatarFile, setAvatarFile] = useState<File | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const { toast } = useToast();

    const { data: profile } = useProfile();
    const updateProfile = useUpdateProfile();
    const uploadAvatar = useUploadAvatar();

    const form = useForm<ProfileFormData>({
        resolver: zodResolver(profileSchema),
        defaultValues: {
            full_name: "",
            job_title: "",
            company: "",
            location: "",
            bio: "",
            website: "",
        },
    });

    // Populate form when profile data loads or modal opens
    useEffect(() => {
        if (profile && open) {
            form.reset({
                full_name: profile.full_name || "",
                job_title: profile.job_title || "",
                company: profile.company || "",
                location: profile.location || "",
                bio: profile.bio || "",
                website: profile.website || "",
            });
            setAvatarPreview(profile.avatar_url || null);
        }
    }, [profile, open, form]);

    const handleAvatarClick = () => {
        fileInputRef.current?.click();
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            if (file.size > 5 * 1024 * 1024) {
                toast({
                    title: "File too large",
                    description: "Please select an image under 5MB",
                    variant: "destructive",
                });
                return;
            }

            setAvatarFile(file);
            const reader = new FileReader();
            reader.onload = (e) => {
                setAvatarPreview(e.target?.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    const onSubmit = async (data: ProfileFormData) => {
        try {
            let avatarUrl: string | undefined;

            if (avatarFile) {
                avatarUrl = await uploadAvatar.mutateAsync(avatarFile);
            }

            await updateProfile.mutateAsync({
                full_name: data.full_name,
                job_title: data.job_title || null,
                company: data.company || null,
                location: data.location || null,
                bio: data.bio || null,
                website: data.website || null,
                ...(avatarUrl && { avatar_url: avatarUrl }),
            });

            toast({
                title: "Profile updated",
                description: "Your profile has been updated successfully.",
            });

            setOpen(false);
            setAvatarFile(null);
        } catch (error) {
            console.error("Failed to update profile:", error);
            toast({
                title: "Error",
                description: "Failed to update your profile. Please try again.",
                variant: "destructive",
            });
        }
    };

    const isSubmitting = updateProfile.isPending || uploadAvatar.isPending;

    return (
        <>
            <Button className="gap-2" onClick={() => setOpen(true)}>
                <Edit className="h-4 w-4" />
                Edit Profile
            </Button>

            <Dialog open={open} onOpenChange={setOpen}>
                <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>Edit Profile</DialogTitle>
                        <DialogDescription>
                            Update your profile information.
                        </DialogDescription>
                    </DialogHeader>

                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 mt-4">
                            {/* Avatar Upload */}
                            <div className="flex flex-col items-center gap-2">
                                <button
                                    type="button"
                                    onClick={handleAvatarClick}
                                    className="relative group"
                                >
                                    <Avatar className="h-24 w-24 border-4 border-secondary">
                                        <AvatarImage src={avatarPreview || undefined} />
                                        <AvatarFallback className="bg-muted text-muted-foreground text-2xl">
                                            {form.watch("full_name")?.[0]?.toUpperCase() || "?"}
                                        </AvatarFallback>
                                    </Avatar>
                                    <div className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
                                        <Camera className="h-6 w-6 text-white" />
                                    </div>
                                </button>
                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    accept="image/*"
                                    onChange={handleFileChange}
                                    className="hidden"
                                />
                                <span className="text-sm text-muted-foreground">
                                    Click to change profile picture
                                </span>
                            </div>

                            {/* Full Name */}
                            <FormField
                                control={form.control}
                                name="full_name"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>
                                            Full Name <span className="text-destructive">*</span>
                                        </FormLabel>
                                        <FormControl>
                                            <Input placeholder="Enter your full name" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            {/* Job Title */}
                            <FormField
                                control={form.control}
                                name="job_title"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Job Title</FormLabel>
                                        <FormControl>
                                            <Input placeholder="e.g., Software Engineer" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            {/* Company */}
                            <FormField
                                control={form.control}
                                name="company"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Company</FormLabel>
                                        <FormControl>
                                            <Input placeholder="Where do you work?" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            {/* Location */}
                            <FormField
                                control={form.control}
                                name="location"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Location</FormLabel>
                                        <FormControl>
                                            <Input placeholder="City, Country" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            {/* Bio */}
                            <FormField
                                control={form.control}
                                name="bio"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Bio</FormLabel>
                                        <FormControl>
                                            <Textarea
                                                placeholder="Tell us a bit about yourself..."
                                                className="resize-none"
                                                rows={3}
                                                {...field}
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            {/* Website */}
                            <FormField
                                control={form.control}
                                name="website"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Website or LinkedIn</FormLabel>
                                        <FormControl>
                                            <Input placeholder="https://..." {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <Button
                                type="submit"
                                className="w-full"
                                disabled={isSubmitting}
                            >
                                {isSubmitting ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Saving...
                                    </>
                                ) : (
                                    "Save Changes"
                                )}
                            </Button>
                        </form>
                    </Form>
                </DialogContent>
            </Dialog>
        </>
    );
}