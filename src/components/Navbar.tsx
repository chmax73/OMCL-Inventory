/**
 * Navbar-Komponente
 * -----------------
 * Zeigt die Hauptnavigation der App an. Enthält Links zu allen wichtigen Seiten
 * und zeigt den aktuell angemeldeten Benutzer.
 */

"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import {
    LayoutDashboard,
    ClipboardPlus,
    ScanBarcode,
    AlertTriangle,
    History,
    User,
    LogOut,
    Shield,
    UserCheck,
    UsersRound,
} from "lucide-react";
import { useUser } from "@/context/UserContext";
import { signOutFromAuth } from "@/app/auth/login/actions";
import { canSeeNavigationLink } from "./navigation-visibility";

// Navigation-Links mit Icon und Pfad
const navLinks = [
    { href: "/", label: "Dashboard", icon: LayoutDashboard },
    { href: "/inventar/neu", label: "Neues Inventar", icon: ClipboardPlus },
    { href: "/scan", label: "Scannen", icon: ScanBarcode },
    { href: "/abweichungen", label: "Abweichungen", icon: AlertTriangle },
    { href: "/audit", label: "Verlauf", icon: History },
    { href: "/auth/users", label: "Benutzerverwaltung", icon: UsersRound },
];

// Icon basierend auf der Rolle
function RoleIcon({ rolle }: { rolle: string }) {
    switch (rolle) {
        case "admin":
            return <Shield className="w-4 h-4 text-error" />;
        case "verantwortlich":
            return <UserCheck className="w-4 h-4 text-warning" />;
        default:
            return <User className="w-4 h-4 text-info" />;
    }
}

// User-Dropdown-Komponente
function UserDropdown() {
    const { user } = useUser();
    const router = useRouter();
    const [logoutError, setLogoutError] = useState(false);

    const handleLogout = async () => {
        try {
            const result = await signOutFromAuth();
            if (!result.success) {
                setLogoutError(true);
                return;
            }
            router.push("/auth/login");
            router.refresh();
        } catch {
            setLogoutError(true);
        }
    };

    if (!user) {
        return (
            <Link href="/auth/login" className="btn btn-ghost gap-2">
                <User className="w-5 h-5" />
                Anmelden
            </Link>
        );
    }

    return (
        <div className="dropdown dropdown-end">
            <div tabIndex={0} role="button" className="btn btn-ghost gap-2">
                <RoleIcon rolle={user.rolle} />
                <span className="hidden sm:inline">{user.name}</span>
            </div>
            <ul
                tabIndex={0}
                className="menu menu-sm dropdown-content bg-base-100 rounded-box z-[1] mt-3 w-52 p-2 shadow"
            >
                <li className="menu-title">
                    <span>{user.name}</span>
                </li>
                {user.rolle === "admin" && (
                    <li>
                        <Link href="/auth/users">
                            <UsersRound className="w-4 h-4" />
                            Benutzerverwaltung
                        </Link>
                    </li>
                )}
                <li>
                    <button onClick={handleLogout} className="text-error">
                        <LogOut className="w-4 h-4" />
                        Abmelden
                    </button>
                </li>
                {logoutError && <li><span className="text-error">Abmelden fehlgeschlagen.</span></li>}
            </ul>
        </div>
    );
}

export default function Navbar() {
    // usePathname gibt den aktuellen Pfad zurück (z.B. "/scan")
    const pathname = usePathname();
    const { user } = useUser();
    const visibleLinks = navLinks.filter((link) => canSeeNavigationLink(link.href, user?.rolle));

    return (
        <div className="navbar bg-base-200 shadow-md">
            {/* Logo / Titel links */}
            <div className="navbar-start">
                <Link href="/" className="btn btn-ghost text-xl font-bold">
                    <ScanBarcode className="w-6 h-6 text-primary" />
                    OMCL Inventur
                </Link>
            </div>

            {/* Navigation in der Mitte */}
            <div className="navbar-center hidden lg:flex">
                <ul className="menu menu-horizontal px-1 gap-1">
                    {visibleLinks.map((link) => {
                        // Prüfe ob dieser Link aktiv ist
                        const isActive = pathname === link.href;
                        const Icon = link.icon;

                        return (
                            <li key={link.href}>
                                <Link
                                    href={link.href}
                                    className={isActive ? "active" : ""}
                                >
                                    <Icon className="w-4 h-4" />
                                    {link.label}
                                </Link>
                            </li>
                        );
                    })}
                </ul>
            </div>

            {/* User-Bereich rechts */}
            <div className="navbar-end">
                <UserDropdown />
            </div>

            {/* Mobile Navigation (Hamburger-Menü) */}
            <div className="navbar-start lg:hidden">
                <div className="dropdown">
                    <div tabIndex={0} role="button" className="btn btn-ghost">
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="h-5 w-5"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth="2"
                                d="M4 6h16M4 12h8m-8 6h16"
                            />
                        </svg>
                    </div>
                    <ul
                        tabIndex={0}
                        className="menu menu-sm dropdown-content bg-base-100 rounded-box z-[1] mt-3 w-52 p-2 shadow"
                    >
                        {visibleLinks.map((link) => {
                            const Icon = link.icon;
                            return (
                                <li key={link.href}>
                                    <Link href={link.href}>
                                        <Icon className="w-4 h-4" />
                                        {link.label}
                                    </Link>
                                </li>
                            );
                        })}
                    </ul>
                </div>
            </div>
        </div>
    );
}
