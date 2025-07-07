"use client";

import * as React from "react";
import Image from "next/image";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Task } from "@/types";
import { cn } from "@/lib/utils";
import { CheckCircle2, Circle, AlertTriangle, CalendarIcon, User, Send, Loader2, Eye, FileUp } from "lucide-react";
import { format, parseISO } from 'date-fns';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "./ui/button";
import { useToast } from "@/hooks/use-toast";
import { sendReminder } from "@/ai/flows/send-reminder-flow";
import { reviewPoster } from "@/ai/flows/review-poster-flow";
import { useTasks } from "@/context/task-context";
import { Input } from "./ui/input";
import { Alert, AlertDescription, AlertTitle } from "./ui/alert";

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
  review: {
    label: "In Review",
    icon: Eye,
    color: "border-yellow-500",
    badgeVariant: "outline" as const,
  }
};

export function TaskCard({ task }: TaskCardProps) {
  const config = statusConfig[task.status];
  const Icon = config.icon;
  const { toast } = useToast();
  const { updateTask } = useTasks();

  const [isSendingReminder, setIsSendingReminder] = React.useState(false);
  const [isReviewing, setIsReviewing] = React.useState(false);
  const [selectedFile, setSelectedFile] = React.useState<File | null>(null);

  const handleSendReminder = async () => {
    if (!task.assignee) return;

    setIsSendingReminder(true);
    try {
        const result = await sendReminder({
            title: task.title,
            description: task.description,
            dueDate: task.dueDate,
            assignee: task.assignee,
            reminderType: 'pending',
        });

        if (result.success) {
            toast({
                title: "Reminder Sent",
                description: result.message,
            });
        } else {
            throw new Error(result.message);
        }
    } catch (error) {
        console.error("Failed to send reminder:", error);
        toast({
            variant: "destructive",
            title: "Failed to send reminder",
            description: "Could not send the reminder. Please try again.",
        });
    } finally {
        setIsSendingReminder(false);
    }
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      setSelectedFile(event.target.files[0]);
    }
  };

  const handlePosterReview = async () => {
    if (!selectedFile) {
        toast({ variant: "destructive", title: "No file selected", description: "Please select a poster image to upload." });
        return;
    }
    setIsReviewing(true);

    const reader = new FileReader();
    reader.readAsDataURL(selectedFile);
    reader.onload = async () => {
        const posterDataUri = reader.result as string;
        
        // Immediately update status to "review"
        updateTask(task.id, { status: 'review', posterUrl: posterDataUri });

        try {
            const result = await reviewPoster({
                posterDataUri,
                taskTitle: task.title,
                taskDescription: task.description,
            });
            
            // Update task with AI feedback
            updateTask(task.id, {
                status: 'pending',
                description: result.revisedDescription,
                corrections: result.corrections,
            });

            toast({
                title: "Review Complete",
                description: `Poster for "${task.title}" has been reviewed and task updated.`,
            });

        } catch (error) {
            console.error("Failed to review poster:", error);
            toast({
                variant: "destructive",
                title: "Review Failed",
                description: "The AI review process failed. Please try again.",
            });
            // Revert status if review fails
            updateTask(task.id, { status: 'pending' });
        } finally {
            setIsReviewing(false);
            setSelectedFile(null);
        }
    };
    reader.onerror = (error) => {
        console.error("File reading error:", error);
        toast({ variant: "destructive", title: "File Error", description: "Could not read the selected file." });
        setIsReviewing(false);
    };
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Card className={cn("rounded-2xl shadow-lg hover:shadow-xl hover:-translate-y-1 transition-all duration-300 border-l-4 cursor-pointer", config.color)}>
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
      </DialogTrigger>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <div className="flex items-center space-x-4">
             <DialogTitle className="text-2xl font-headline">{task.title}</DialogTitle>
             <Badge variant={config.badgeVariant} className="capitalize flex items-center gap-1 h-fit">
                  <Icon className="h-3 w-3" />
                  {config.label}
              </Badge>
          </div>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <p className="text-muted-foreground">{task.description}</p>
          
          {task.posterUrl && (
            <div className="mt-4">
                <h4 className="font-semibold mb-2">Submitted Poster:</h4>
                <div className="relative aspect-video w-full rounded-lg overflow-hidden border">
                    <Image src={task.posterUrl} alt={`Poster for ${task.title}`} layout="fill" objectFit="contain" />
                </div>
            </div>
          )}

          {task.corrections && (
             <Alert className="mt-4">
                <AlertTitle>AI Review Feedback</AlertTitle>
                <AlertDescription>
                    <pre className="whitespace-pre-wrap font-sans">{task.corrections}</pre>
                </AlertDescription>
            </Alert>
          )}

          <div className="flex flex-col gap-2 text-sm pt-4 border-t">
              <div className="flex items-center text-muted-foreground">
                <CalendarIcon className="mr-2 h-4 w-4" />
                <span className="font-medium">Due Date:</span>&nbsp;
                <span>{format(parseISO(task.dueDate), "PPP")}</span>
              </div>
              {task.assignee && (
                <div className="flex items-center text-muted-foreground">
                  <User className="mr-2 h-4 w-4" />
                  <span className="font-medium">Assigned to:</span>&nbsp;
                  <span>{task.assignee}</span>
                </div>
              )}
          </div>
        </div>
        <div className="pt-4 mt-4 border-t flex flex-col gap-4">
            {(task.status === 'pending' || task.status === 'overdue') && (
                <div>
                    <h4 className="font-semibold text-sm mb-2">{task.posterUrl ? "Submit a New Poster" : "Submit Poster for Review"}</h4>
                    <div className="flex items-center gap-2">
                        <Input type="file" accept="image/*" onChange={handleFileChange} className="flex-grow" />
                        <Button onClick={handlePosterReview} disabled={isReviewing || !selectedFile}>
                            {isReviewing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <FileUp className="mr-2 h-4 w-4" />}
                            {isReviewing ? "Uploading..." : task.posterUrl ? "Resubmit" : "Upload"}
                        </Button>
                    </div>
                </div>
            )}
            {(task.status === 'pending' || task.status === 'overdue') && task.assignee && (
                <div className="flex justify-end">
                    <Button onClick={handleSendReminder} disabled={isSendingReminder}>
                        {isSendingReminder ? (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : (
                            <Send className="mr-2 h-4 w-4" />
                        )}
                        {isSendingReminder ? "Sending..." : "Send Reminder to Assignee"}
                    </Button>
                </div>
            )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
