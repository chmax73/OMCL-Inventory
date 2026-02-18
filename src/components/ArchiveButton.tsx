/**
 * ArchiveButton
 * -------------
 * Client-Komponente zum Archivieren eines abgeschlossenen Inventars.
 * Wird im Dashboard (Server Component) eingebettet.
 */

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Archive } from "lucide-react";
import { archiveInventar } from "@/app/actions";

export default function ArchiveButton({ inventarId }: { inventarId: string }) {
    const router = useRouter();
    const [isArchiving, setIsArchiving] = useState(false);

    const handleArchive = async () => {
        if (!confirm("Inventar archivieren? Es wird vom Dashboard entfernt und ist dann nur noch im Archiv sichtbar.")) {
            return;
        }
        setIsArchiving(true);
        await archiveInventar(inventarId);
        setIsArchiving(false);
        router.refresh();
    };

    return (
        <button
            onClick={handleArchive}
            disabled={isArchiving}
            className="btn btn-sm btn-ghost gap-1"
            title="Archivieren"
        >
            {isArchiving ? (
                <span className="loading loading-spinner loading-xs"></span>
            ) : (
                <Archive className="w-3 h-3" />
            )}
            Archivieren
        </button>
    );
}
