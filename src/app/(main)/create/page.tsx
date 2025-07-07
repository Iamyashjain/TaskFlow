import { TaskForm } from "@/components/task-form";

export default function CreateTaskPage() {
  return (
    <div>
        <div className="mb-8">
            <h2 className="text-3xl font-bold tracking-tight font-headline">New Task</h2>
            <p className="text-muted-foreground">Fill out the form below to create a new task.</p>
        </div>
        <TaskForm />
    </div>
  )
}
