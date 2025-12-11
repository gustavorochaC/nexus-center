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
      
      <main className="container mx-auto px-4 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h1 className="text-2xl font-semibold text-foreground">
            Good morning, {currentUser.name.split(" ")[0]}
          </h1>
          <p className="mt-1 text-muted-foreground">
            Access your applications and tools from one place
          </p>
        </div>

        {/* Apps with Full Access */}
        <section className="mb-8">
          <h2 className="mb-4 text-sm font-medium uppercase tracking-wider text-muted-foreground">
            Full Access
          </h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {editorApps.map((app) => (
              <AppCard key={app.id} app={app} />
            ))}
          </div>
        </section>

        {/* Apps with View Access */}
        <section className="mb-8">
          <h2 className="mb-4 text-sm font-medium uppercase tracking-wider text-muted-foreground">
            View Only
          </h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {viewerApps.map((app) => (
              <AppCard key={app.id} app={app} />
            ))}
          </div>
        </section>

        {/* Locked Apps */}
        <section>
          <h2 className="mb-4 text-sm font-medium uppercase tracking-wider text-muted-foreground">
            Requires Access
          </h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {lockedApps.map((app) => (
              <AppCard key={app.id} app={app} />
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}
