/**
 * Leitet alte Login-Links auf die echte Supabase-Anmeldung weiter.
 * Die fruehere Auswahl beliebiger Testbenutzer ist hier nicht mehr moeglich.
 */

import { redirect } from "next/navigation";

export default function LoginPage() {
    redirect("/auth/login");
}
