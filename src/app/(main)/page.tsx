"use client"
import { TaskCard } from "@/components/task-card";
import { useTasks } from "@/context/task-context";

export default function DashboardPage() {
  const { tasks } = useTasks();
  
  return (
    <div className="flex flex-col gap-8">
      <div>
        <h2 className="text-3xl font-bold tracking-tight font-headline">
          Welcome back!
        </h2>
        <p className="text-muted-foreground">Here's a list of your tasks.</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {tasks.map((task) => (
          <TaskCard key={task.id} task={task} />
        ))}
      </div>
    </div>
  );
}
