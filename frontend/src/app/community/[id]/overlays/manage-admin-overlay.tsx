import Overlay from "@/components/overlays/overlay";
import Button from "@/components/ui/button";
import Input from "@/components/ui/input";
import { addAdmin, removeAdmin, useAdmins } from "@/lib/api/community";
import { useState } from "react";
import { useSWRConfig } from "swr";

interface ManageAdminsOverlayProps {
    close: () => void;
    communityId: number;
}

export default function ManageAdminsOverlay({
    close,
    communityId,
}: ManageAdminsOverlayProps) {
    const { data: admins } = useAdmins(communityId);
    const { mutate } = useSWRConfig();

    const [addUsername, setAddUsername] = useState("");

    const onAdd = async () => {
        await addAdmin(communityId, addUsername);
        await mutate(`/communities/${communityId}/admins`);
    };

    const onRemove = (userId: number) => async () => {
        await removeAdmin(communityId, userId);
        await mutate(`/communities/${communityId}/admins`);
    };

    return (
        <Overlay
            onClose={close}
            title="Manage administrators"
            className="w-[500px] max-h-[85vh]"
        >
            <div className="space-y-4">
                <div>
                    <div className="flex flex-row gap-2">
                        <Input
                            type="text"
                            placeholder="Enter username"
                            onChange={(e) => setAddUsername(e.target.value)}
                        />
                        <Button onClick={onAdd} className="whitespace-nowrap">
                            Add
                        </Button>
                    </div>
                </div>
                {/* Owner (admins[0]), separator, then list of the other admins */}
                <div>
                    <div className="flex items-center justify-between p-2 bg-primary/10 rounded-lg mb-2">
                        <span className="text-primary font-semibold">
                            Owner
                        </span>
                        <span className="text-slate-800">
                            {admins[0]?.username}
                        </span>
                    </div>
                    <hr className="border-border mb-2" />
                    <div className="flex items-center justify-between p-2 bg-surface rounded-lg mb-2">
                        <span className="text-slate-800 font-semibold">
                            Administrators
                        </span>
                    </div>
                    <div className="max-h-64 overflow-y-auto">
                        {admins.slice(1).map((admin) => (
                            <div
                                key={admin.id}
                                className="flex items-center justify-between p-2 bg-surface rounded-lg mb-2 hover:bg-surface-hover transition-colors"
                            >
                                <span className="text-slate-700">
                                    {admin.username}
                                </span>
                                <button
                                    onClick={onRemove(admin.id)}
                                    className="text-danger hover:text-red-700 transition-colors text-sm"
                                >
                                    Remove
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </Overlay>
    );
}
