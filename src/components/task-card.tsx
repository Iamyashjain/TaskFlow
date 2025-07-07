import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Task } from "@/types";
import { cn } from "@/lib/utils";
import { CheckCircle2, Circle, AlertTriangle, CalendarIcon, User } from "lucide-react";
import { format, parseISO } from 'date-fns';

interface TaskCardProps {
  task: Task;
}

const statusConfig = {
  pending: {
    label: "Pending",
    icon: Circle,
    color: "border-blue-500",
    badgeVariant: "secondary" as const,
  },
  completed: {
    label: "Completed",
    icon: CheckCircle2,
    color: "border-green-500",
    badgeVariant: "default" as const,
  },
  overdue: {
    label: "Overdue",
    icon: AlertTriangle,
    color: "border-red-500",
    badgeVariant: "destructive" as const,
  },
};

export function TaskCard({ task }: TaskCardProps) {
  const config = statusConfig[task.status];
  const Icon = config.icon;

  return (
    <Card className={cn("rounded-2xl shadow-lg hover:shadow-xl hover:-translate-y-1 transition-all duration-300 border-l-4", config.color)}>
      <CardHeader>
        <div className="flex justify-between items-start">
            <CardTitle className="text-xl font-headline mb-2">{task.title}</CardTitle>
            <Badge variant={config.badgeVariant} className="capitalize flex items-center gap-1">
                <Icon className="h-3 w-3" />
                {config.label}
            </Badge>
        </div>
        <CardDescription className="line-clamp-2">{task.description}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col gap-2 text-sm text-muted-foreground">
            <div className="flex items-center">
              <CalendarIcon className="mr-2 h-4 w-4" />
              <span>Due: {format(parseISO(task.dueDate), "PPP")}</span>
            </div>
            {task.assignee && (
              <div className="flex items-center">
                <User className="mr-2 h-4 w-4" />
                <span>{task.assignee}</span>
              </div>
            )}
        </div>
      </CardContent>
    </Card>
  );
}
