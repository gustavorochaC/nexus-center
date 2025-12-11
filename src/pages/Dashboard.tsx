import { Header } from "@/components/Header";
import { AppCard } from "@/components/AppCard";
import { apps, currentUser } from "@/data/apps";

export default function Dashboard() {
  const editorApps = apps.filter((app) => app.permission === "editor");
  const viewerApps = apps.filter((app) => app.permission === "viewer");
  const lockedApps = apps.filter((app) => app.permission === "locked");

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container mx-auto px-4 py-12 max-w-5xl">
        {/* Welcome Section */}
        <div className="mb-12 text-center">
          <h1 className="text-3xl font-semibold text-foreground tracking-tight">
            Welcome back, {currentUser.name.split(" ")[0]}
          </h1>
          <p className="mt-2 text-muted-foreground text-lg">
            Access your applications and tools from one place
          </p>
        </div>

        {/* Apps with Full Access */}
        {editorApps.length > 0 && (
          <section className="mb-10">
            <h2 className="mb-6 text-xs font-semibold uppercase tracking-widest text-muted-foreground text-center">
              Full Access
            </h2>
            <div className="grid gap-6 sm:grid-cols-2">
              {editorApps.map((app) => (
                <AppCard key={app.id} app={app} />
              ))}
            </div>
          </section>
        )}

        {/* Apps with View Access */}
        {viewerApps.length > 0 && (
          <section className="mb-10">
            <h2 className="mb-6 text-xs font-semibold uppercase tracking-widest text-muted-foreground text-center">
              View Only
            </h2>
            <div className="grid gap-6 sm:grid-cols-2">
              {viewerApps.map((app) => (
                <AppCard key={app.id} app={app} />
              ))}
            </div>
          </section>
        )}

        {/* Locked Apps */}
        {lockedApps.length > 0 && (
          <section className="mb-10">
            <h2 className="mb-6 text-xs font-semibold uppercase tracking-widest text-muted-foreground text-center">
              Requires Access
            </h2>
            <div className="grid gap-6 sm:grid-cols-2">
              {lockedApps.map((app) => (
                <AppCard key={app.id} app={app} />
              ))}
            </div>
          </section>
        )}
      </main>
    </div>
  );
}
