"use client"
import { TaskCard } from "@/components/task-card";
import { useTasks } from "@/context/task-context";
import { CheckCircle, Clock } from "lucide-react";

export default function DashboardPage() {
  const { tasks } = useTasks();

  const pendingTasks = tasks.filter(task => task.status === 'pending' || task.status === 'overdue' || task.status === 'review');
  const completedTasks = tasks.filter(task => task.status === 'completed');

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h2 className="text-3xl font-bold tracking-tight font-headline">
          Welcome back!
        </h2>
        <p className="text-muted-foreground">Here's a list of your tasks.</p>
      </div>

      <div className="space-y-8">
        <section>
          <div className="flex items-center gap-3 mb-4">
            <Clock className="h-6 w-6 text-primary" />
            <h3 className="text-2xl font-semibold font-headline">In Progress</h3>
          </div>
          {pendingTasks.length > 0 ? (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {pendingTasks.map((task) => (
                <TaskCard key={task.id} task={task} />
              ))}
            </div>
          ) : (
            <div className="rounded-lg border border-dashed p-8 text-center text-muted-foreground">
              <p>No pending tasks. Great job!</p>
            </div>
          )}
        </section>

        <section>
          <div className="flex items-center gap-3 mb-4">
            <CheckCircle className="h-6 w-6 text-green-500" />
            <h3 className="text-2xl font-semibold font-headline">Completed</h3>
          </div>
          {completedTasks.length > 0 ? (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {completedTasks.map((task) => (
                <TaskCard key={task.id} task={task} />
              ))}
            </div>
          ) : (
             <div className="rounded-lg border border-dashed p-8 text-center text-muted-foreground">
              <p>No tasks completed yet.</p>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
