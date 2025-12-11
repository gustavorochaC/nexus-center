import { 
  Users, 
  DollarSign, 
  Package, 
  FileText, 
  Calendar, 
  BarChart3 
} from "lucide-react";

export type PermissionLevel = "editor" | "viewer" | "locked";

export interface AppData {
  id: string;
  name: string;
  description: string;
  icon: typeof Users;
  color: string;
  permission: PermissionLevel;
}

export const apps: AppData[] = [
  {
    id: "hr-portal",
    name: "HR Portal",
    description: "Manage employee records, onboarding, and benefits",
    icon: Users,
    color: "hsl(220, 70%, 50%)",
    permission: "editor",
  },
  {
    id: "finance-system",
    name: "Finance System",
    description: "Budget tracking, invoices, and expense reports",
    icon: DollarSign,
    color: "hsl(142, 70%, 45%)",
    permission: "editor",
  },
  {
    id: "inventory-manager",
    name: "Inventory Manager",
    description: "Track stock levels and manage supply chain",
    icon: Package,
    color: "hsl(25, 90%, 55%)",
    permission: "viewer",
  },
  {
    id: "document-hub",
    name: "Document Hub",
    description: "Company policies, templates, and shared files",
    icon: FileText,
    color: "hsl(280, 65%, 55%)",
    permission: "viewer",
  },
  {
    id: "meeting-scheduler",
    name: "Meeting Scheduler",
    description: "Book rooms and coordinate team calendars",
    icon: Calendar,
    color: "hsl(340, 75%, 55%)",
    permission: "locked",
  },
  {
    id: "analytics-dashboard",
    name: "Analytics Dashboard",
    description: "Business intelligence and performance metrics",
    icon: BarChart3,
    color: "hsl(200, 80%, 50%)",
    permission: "locked",
  },
];

export const currentUser = {
  name: "Alex Johnson",
  email: "alex.johnson@company.com",
  avatar: "AJ",
  role: "Product Manager",
};
