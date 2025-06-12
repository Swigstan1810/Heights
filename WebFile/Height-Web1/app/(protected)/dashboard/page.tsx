// app/(protected)/dashboard/page.tsx
import { ComingSoon } from "@/components/ui/coming-soon";

export default function DashboardPage() {
  return (
    <ComingSoon 
      title="Dashboard Coming Soon" 
      description="Your personalized trading dashboard will be available soon."
    />
  );
}