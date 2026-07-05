import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { signOut } from "@/actions/auth";
import { Mail, Calendar, User, LogOut } from "lucide-react";
import SettingsForm from "@/components/settings/SettingsForm";
import { getUserProfile } from "@/lib/supabase/db";
import DashboardLayout from "@/components/layout/DashboardLayout";

export default async function SettingsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const userProfile = await getUserProfile(user.id);
  const initialApiKey = userProfile?.gemini_api_key || null;

  const displayName =
    user.user_metadata?.full_name ??
    user.email?.split("@")[0] ??
    "User";

  const initials = displayName
    .split(" ")
    .map((n: string) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  const joinedAt = new Date(user.created_at).toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });

  return (
    <DashboardLayout
      activeTab="settings"
      initials={initials}
      displayName={displayName}
      email={user.email || ""}
    >
      {/* Main content */}
      <main className="dashboard-main">
        <header className="dashboard-header">
          <div>
            <h1 className="dashboard-greeting">Profile & Settings</h1>
            <p className="dashboard-sub">Manage your account details</p>
          </div>
        </header>

        {/* Profile card */}
        <section className="dashboard-section">
          <div className="profile-card">
            <div className="profile-avatar-lg">{initials}</div>

            <div className="profile-info">
              <h2 className="profile-name">{displayName}</h2>

              <div className="profile-detail">
                <Mail size={15} />
                <span>{user.email}</span>
              </div>

              <div className="profile-detail">
                <Calendar size={15} />
                <span>Joined {joinedAt}</span>
              </div>

              <div className="profile-detail">
                <User size={15} />
                <span>User ID: {user.id.slice(0, 8)}…</span>
              </div>
            </div>
          </div>
          <SettingsForm initialApiKey={initialApiKey} />
        </section>

        {/* Danger zone */}
        <section className="dashboard-section">
          <h2 className="section-title">Account</h2>
          <div className="danger-card">
            <div>
              <p className="danger-title">Sign out of all devices</p>
              <p className="danger-desc">
                You&apos;ll need to sign in again with your email magic link.
              </p>
            </div>
            <form action={signOut}>
              <button type="submit" className="btn-danger" id="signout-all-btn">
                <LogOut size={15} />
                Sign Out
              </button>
            </form>
          </div>
        </section>
      </main>
    </DashboardLayout>
  );
}
