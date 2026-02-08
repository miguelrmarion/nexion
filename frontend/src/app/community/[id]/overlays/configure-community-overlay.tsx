"use client";
import Overlay from "@/components/overlays/overlay";
import Button from "@/components/ui/button";
import Input from "@/components/ui/input";
import TextArea from "@/components/ui/text-area";
import { useFilePreview } from "@/hooks/use-file-preview";
import {
    ListCommunityDto,
    updateCommunity,
    updateCommunityImages,
} from "@/lib/api/community";
import { FormEvent, useRef, useState } from "react";
import { toast } from "react-hot-toast";
import { useSWRConfig } from "swr";

interface BannerPickerProps {
    preview: string | null;
    onFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

function BannerPicker({ preview, onFileChange }: BannerPickerProps) {
    const inputRef = useRef<HTMLInputElement>(null);

    return (
        <div className="space-y-2">
            <label className="block text-sm font-medium text-slate-700">
                Banner Image
            </label>
            {preview && (
                <div className="w-full h-32 bg-surface rounded-lg overflow-hidden border border-border">
                    <img
                        src={preview}
                        alt="Banner Preview"
                        className="w-full h-full object-cover"
                    />
                </div>
            )}
            <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={() => inputRef.current?.click()}
            >
                {preview ? "Change Banner" : "Add Banner"}
            </Button>
            <input
                ref={inputRef}
                type="file"
                accept="image/*"
                onChange={onFileChange}
                className="hidden"
            />
        </div>
    );
}

interface IconPickerProps {
    preview: string | null;
    onFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    fallbackChar: string;
}

function IconPicker({ preview, onFileChange, fallbackChar }: IconPickerProps) {
    const inputRef = useRef<HTMLInputElement>(null);

    return (
        <div className="space-y-2">
            <label className="block text-sm font-medium text-slate-700">
                Community Icon
            </label>
            <div className="flex items-center space-x-4">
                {preview ? (
                    <img
                        src={preview}
                        alt="Icon Preview"
                        className="w-16 h-16 rounded-full object-cover border-2 border-border ring-2 ring-primary/20"
                    />
                ) : (
                    <div className="w-16 h-16 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center border-2 border-white">
                        <span className="text-xl font-bold text-white">
                            {fallbackChar}
                        </span>
                    </div>
                )}
                <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    onClick={() => inputRef.current?.click()}
                >
                    {preview ? "Change Icon" : "Add Icon"}
                </Button>
            </div>
            <input
                ref={inputRef}
                type="file"
                accept="image/*"
                onChange={onFileChange}
                className="hidden"
            />
        </div>
    );
}

interface AutoPublishToggleProps {
    checked: boolean;
    onChange: (checked: boolean) => void;
}

function AutoPublishToggle({ checked, onChange }: AutoPublishToggleProps) {
    return (
        <div className="flex items-center">
            <input
                name="autoPost"
                type="checkbox"
                className="mr-2 accent-primary"
                checked={checked}
                onChange={(e) => onChange(e.target.checked)}
            />
            <label htmlFor="autoPost" className="text-slate-700">
                Auto-publish posts
                <span className="text-muted text-sm italic ml-1">
                    (If not active, posts require validation)
                </span>
            </label>
        </div>
    );
}

interface ConfigureCommunityOverlayProps {
    close: () => void;
    communityData: ListCommunityDto;
}

export default function ConfigureCommunityOverlay({
    close,
    communityData,
}: ConfigureCommunityOverlayProps) {
    const [currentName, setCurrentName] = useState(communityData.name);
    const [currentDescription, setCurrentDescription] = useState(
        communityData.description,
    );
    const [autoPublishPosts, setAutoPublishPosts] = useState(
        communityData.autoPublishPosts,
    );

    const {
        file: bannerImage,
        preview: bannerPreview,
        handleFileChange: handleBannerChange,
    } = useFilePreview(communityData.bannerImage || null);

    const {
        file: iconImage,
        preview: iconPreview,
        handleFileChange: handleIconChange,
    } = useFilePreview(communityData.iconImage || null);

    const { mutate } = useSWRConfig();

    const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();

        try {
            await updateCommunity(
                communityData.id,
                currentName,
                currentDescription,
                autoPublishPosts,
            );

            if (bannerImage || iconImage)
                await updateCommunityImages(
                    communityData.id,
                    bannerImage || undefined,
                    iconImage || undefined,
                );

            await Promise.all([
                mutate(`/communities/community/${communityData.id}`),
                mutate("/communities"),
                mutate(
                    (key) =>
                        typeof key === "string" &&
                        key.includes(`/communities/${communityData.id}`),
                ),
            ]);

            toast.success("Community updated successfully!");
            close();
        } catch (error) {
            toast.error("Error updating community");
        }
    };

    return (
        <Overlay
            onClose={close}
            title="Configure community"
            className="w-[80vh] max-h-[85vh]"
        >
            <form onSubmit={handleSubmit} className="flex flex-col space-y-4">
                <div className="max-h-[55vh] overflow-y-auto space-y-4">
                    <Input
                        type="text"
                        placeholder="Community name"
                        value={currentName}
                        onChange={(e) => setCurrentName(e.target.value)}
                        required
                    />

                    <TextArea
                        placeholder="Community description"
                        className="h-20"
                        value={currentDescription}
                        onChange={(e) => setCurrentDescription(e.target.value)}
                        required
                    />

                    <BannerPicker
                        preview={bannerPreview}
                        onFileChange={handleBannerChange}
                    />

                    <IconPicker
                        preview={iconPreview}
                        onFileChange={handleIconChange}
                        fallbackChar={currentName.charAt(0).toUpperCase()}
                    />

                    <AutoPublishToggle
                        checked={autoPublishPosts}
                        onChange={setAutoPublishPosts}
                    />
                </div>

                <div className="flex justify-end space-x-3 pt-4 border-t border-border">
                    <Button type="button" variant="secondary" onClick={close}>
                        Cancel
                    </Button>
                    <Button type="submit">Save settings</Button>
                </div>
            </form>
        </Overlay>
    );
}
