/**
 * Startseite - OMCL Inventur Tool
 * --------------------------------
 * Diese Seite zeigt eine Willkommensnachricht und dient als Einstiegspunkt.
 * Später wird hier das Dashboard oder die Login-Seite angezeigt.
 */

import { ClipboardList } from "lucide-react";

export default function Home() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-base-200">
      <main className="text-center p-8">
        {/* Hero-Bereich mit Icon und Titel */}
        <div className="flex flex-col items-center gap-4 mb-8">
          <div className="bg-primary text-primary-content p-4 rounded-full">
            <ClipboardList size={48} />
          </div>
          <h1 className="text-4xl font-bold">OMCL Inventur Tool</h1>
          <p className="text-lg text-base-content/70 max-w-md">
            Inventurverwaltung für Swissmedic OMCL nach ISO/IEC 17025:2017
          </p>
        </div>

        {/* Status-Card mit daisyUI */}
        <div className="card bg-base-100 shadow-xl max-w-md mx-auto">
          <div className="card-body">
            <h2 className="card-title justify-center">Setup in Arbeit</h2>
            <p className="text-base-content/70">
              Die Anwendung wird gerade eingerichtet. Bitte warten...
            </p>
            <div className="card-actions justify-center mt-4">
              <button className="btn btn-primary" disabled>
                Zum Dashboard
              </button>
            </div>
          </div>
        </div>

        {/* Tech-Stack Info */}
        <div className="mt-8 text-sm text-base-content/50">
          <p>Next.js • Tailwind CSS • daisyUI • Prisma • Supabase</p>
        </div>
      </main>
    </div>
  );
}
