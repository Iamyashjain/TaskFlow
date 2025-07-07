"use client"
import { TaskCard } from "@/components/task-card";
// import { useAuth } from "@/hooks/use-auth"; // Auth disabled for now
import { Task } from "@/types";

const mockTasks: Task[] = [
  {
    id: "1",
    title: "Design Landing Page",
    description: "Create a modern and responsive design for the new landing page using Figma. The design should be clean, intuitive, and align with our brand's color scheme and typography. Make sure to include sections for features, testimonials, and a clear call-to-action.",
    status: "pending",
    dueDate: "2024-09-15T00:00:00.000Z",
    assignee: "alice@example.com",
  },
  {
    id: "2",
    title: "Implement Authentication",
    description: "Set up Firebase Google Sign-In and create protected routes for the application. This includes creating the sign-in page, handling user sessions, and securing routes that require authentication.",
    status: "pending",
    dueDate: "2024-09-20T00:00:00.000Z",
    assignee: "bob@example.com",
  },
  {
    id: "3",
    title: "Fix Login Bug",
    description: "A bug is preventing users from logging out correctly on mobile devices. The issue seems to be related to session invalidation on the client-side. Investigate and apply a fix.",
    status: "overdue",
    dueDate: "2024-08-30T00:00:00.000Z",
    assignee: "charlie@example.com",
  },
  {
    id: "4",
    title: "Deploy v1.0",
    description: "Deploy the first version of the application to production servers. This involves running the production build, configuring the server environment, and ensuring the application is live and accessible to users.",
    status: "completed",
    dueDate: "2024-08-25T00:00:00.000Z",
  },
  {
    id: "5",
    title: "Write API Documentation",
    description: "Document all public API endpoints for third-party developers. The documentation should be clear, concise, and include examples for each endpoint. Use a standard format like OpenAPI/Swagger.",
    status: "pending",
    dueDate: "2024-09-30T00:00:00.000Z",
    assignee: "alice@example.com",
  },
   {
    id: "6",
    title: "User Profile Page",
    description: "Develop the user profile page where users can view and update their personal information, such as display name and profile picture.",
    status: "completed",
    dueDate: "2024-09-01T00:00:00.000Z",
  },
];

export default function DashboardPage() {
  // const { user } = useAuth(); // Auth disabled for now
  
  return (
    <div className="flex flex-col gap-8">
      <div>
        <h2 className="text-3xl font-bold tracking-tight font-headline">
          Welcome back!
        </h2>
        <p className="text-muted-foreground">Here's a list of your tasks.</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {mockTasks.map((task) => (
          <TaskCard key={task.id} task={task} />
        ))}
      </div>
    </div>
  );
}
