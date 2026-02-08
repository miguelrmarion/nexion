import Overlay from "@/components/overlays/overlay";
import Button from "@/components/ui/button";
import Input from "@/components/ui/input";
import TextArea from "@/components/ui/text-area";
import { useFilePreview } from "@/hooks/use-file-preview";
import { createCommunity, uploadImage } from "@/lib/api/community";
import { useRouter } from "next/navigation";
import { useState } from "react";

interface ImageUploadFieldProps {
    label: string;
    preview: string | null;
    onFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    previewClassName: string;
}

function ImageUploadField({
    label,
    preview,
    onFileChange,
    previewClassName,
}: ImageUploadFieldProps) {
    return (
        <div className="mb-4">
            <label className="block text-sm font-medium mb-2 text-slate-700">
                {label}
            </label>
            <Input type="file" accept="image/*" onChange={onFileChange} />
            {preview && (
                <div className="mt-2 flex justify-center">
                    <img
                        src={preview}
                        alt="Preview"
                        className={previewClassName}
                    />
                </div>
            )}
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

export default function CreateCommunityOverlay({
    close,
}: {
    close: () => void;
}) {
    const router = useRouter();

    const [communityName, setCommunityName] = useState("");
    const [communityDescription, setCommunityDescription] = useState("");
    const [autoPublishPosts, setAutoPublishPosts] = useState(false);
    const [error, setError] = useState("");

    const {
        file: iconImage,
        preview: iconPreview,
        handleFileChange: handleIconChange,
    } = useFilePreview();

    const {
        file: bannerImage,
        preview: bannerPreview,
        handleFileChange: handleBannerChange,
    } = useFilePreview();

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setError("");

        try {
            let iconUrl: string | undefined;
            let bannerUrl: string | undefined;

            if (iconImage) iconUrl = await uploadImage(iconImage);

            if (bannerImage) bannerUrl = await uploadImage(bannerImage);

            const community = await createCommunity(
                communityName,
                communityDescription,
                autoPublishPosts,
                iconUrl,
                bannerUrl,
            );

            router.push(`/community/${community.id}`);
        } catch (error) {
            setError("Error creating community");
        }
    };

    return (
        <Overlay onClose={close} title="Create community">
            <form onSubmit={handleSubmit}>
                {error && (
                    <div className="bg-danger/10 text-danger p-3 rounded-lg mb-4 text-sm">
                        {error}
                    </div>
                )}

                <Input
                    type="text"
                    placeholder="Community name"
                    className="mb-4"
                    value={communityName}
                    onChange={(e) => setCommunityName(e.target.value)}
                    required
                    minLength={3}
                />
                <TextArea
                    placeholder="Community description"
                    className="mb-4"
                    value={communityDescription}
                    onChange={(e) => setCommunityDescription(e.target.value)}
                    required
                />

                <ImageUploadField
                    label="Community icon (optional)"
                    preview={iconPreview}
                    onFileChange={handleIconChange}
                    previewClassName="w-16 h-16 rounded-full object-cover border-2 border-border ring-2 ring-primary/20"
                />

                <ImageUploadField
                    label="Community banner (optional)"
                    preview={bannerPreview}
                    onFileChange={handleBannerChange}
                    previewClassName="w-full h-24 object-cover rounded-lg border-2 border-border"
                />

                <AutoPublishToggle
                    checked={autoPublishPosts}
                    onChange={setAutoPublishPosts}
                />

                <div className="mt-4">
                    <Button type="submit">Create community</Button>
                </div>
            </form>
        </Overlay>
    );
}
