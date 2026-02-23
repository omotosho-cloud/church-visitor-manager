import DashboardLayout from "@/components/dashboard-layout";
import { ErrorBoundary } from "@/components/error-boundary";

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <ErrorBoundary>
      <DashboardLayout>{children}</DashboardLayout>
    </ErrorBoundary>
  );
}
