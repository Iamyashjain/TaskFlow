"use client";

import * as React from "react";
import Image from "next/image";
import { deleteField } from "firebase/firestore";
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Task } from "@/types";
import { cn } from "@/lib/utils";
import {
  CheckCircle2,
  Circle,
  AlertTriangle,
  CalendarIcon,
  User,
  Send,
  Loader2,
  Eye,
  FileUp,
  ThumbsUp,
  Lightbulb,
  Star,
} from "lucide-react";
import { format, parseISO } from "date-fns";
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
import { reviewTaskByType } from "@/app/actions/review-tasks";

import { useTasks } from "@/context/task-context";
import { Input } from "./ui/input";
import { ScrollArea } from "./ui/scroll-area";
import { Progress } from "./ui/progress";

const verticalLeads = {
  content: "rudrajabalpur1112@gmail.com",
  design: "rudrajabalpur1112@gmail.com",
  administration: "rudrajabalpur1112@gmail.com",
  media: "rudrajabalpur1112@gmail.com",
};

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
  },
  aiApproved: {
    label: "AI Approved",
    icon: ThumbsUp,
    color: "border-blue-500", // Or another color indicating pending lead review
    badgeVariant: "outline" as const,
  },
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
        reminderType: "pending",
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
      toast({
        variant: "destructive",
        title: "No input provided",
        description:
          task.type === "administration"
            ? "Please paste the Google Form link."
            : "Please select a file to upload.",
      });
      return;
    }

    setIsReviewing(true);

    try {
      let fileType: Task["submissionFileType"] = "image"; // default

      if (selectedFile.type.startsWith("video/")) {
        fileType = "video";
      } else if (selectedFile.type === "application/pdf") {
        fileType = "pdf";
      } else if (task.type === "administration") {
        fileType = "form";
      }

      // Read file content based on type
      const submissionData: string = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(selectedFile);
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
      });
      // Save uploaded input to task
      updateTask(task.id, {
        status: "review",
        submissionUrl: submissionData,
        submissionFileType: fileType,
        // posterUrl: fileType === "image" ? submissionUrl : deleteField(), // optional fallback
      });

      console.log("✅ Updated task with submission:", {
        submissionUrl: submissionData,
        fileType,
      });

      // Unified review call
      const validTypes = ["design", "content", "media", "administration"];
      const rawType = task.type;
      const taskType = (rawType || "").toLowerCase();
      console.log("🟨 Task type:", task.type);

      if (!validTypes.includes(taskType)) {
        console.error("❌ Invalid task type:", rawType, taskType);
        throw new Error(`Unsupported task type passed: ${rawType}`);
      }

      const result = await reviewTaskByType({
        type: taskType as "design" | "content" | "media" | "administration",
        fileDataUri: submissionData,
        taskTitle: task.title,
        taskDescription: task.description,
      });

      // Update task with feedback
      updateTask(task.id, {
        status: result.decision === "aiApproved" ? "aiApproved" : "pending",
        reviewFeedback: {
          positive: result.positivePoints,
          negative: result.negativePoints,
          rating: result.rating,
        },
      });

      toast({
        title: "Review Complete",
        description:
          result.decision === "aiApproved"
            ? `Task "${task.title}" has been AI Approved.`
            : `Task "${task.title}" needs more work.`,
      });

      if (result.decision === "aiApproved") {
        const leadEmail =
          verticalLeads[task.type as keyof typeof verticalLeads];
        if (leadEmail) {
          try {
            await sendReminder({
              title: task.title,
              description: task.description,
              dueDate: task.dueDate,
              assignee: leadEmail,
              reminderType: "assignment",
            });

            toast({
              title: "Lead Notified",
              description: `The lead for ${task.type} has been notified of the AI approved task.`,
            });
          } catch (sendError) {
            console.error("Failed to send lead notification:", sendError);
            toast({
              variant: "destructive",
              title: "Lead Notification Failed",
              description: `Could not notify the lead for ${task.type}.`,
            });
          }
        }
      }
    } catch (error) {
      console.error("Review error:", error);
      toast({
        variant: "destructive",
        title: "Review Failed",
        description:
          "There was an issue submitting or reviewing the file/link.",
      });
      updateTask(task.id, { status: "pending" });
    } finally {
      setIsReviewing(false);
      setSelectedFile(null);
    }
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Card
          className={cn(
            "rounded-2xl shadow-lg hover:shadow-xl hover:-translate-y-1 transition-all duration-300 border-l-4 cursor-pointer",
            config.color
          )}
        >
          <CardHeader>
            <div className="flex justify-between items-start">
              <CardTitle className="text-xl font-headline mb-2">
                {task.title}
              </CardTitle>
                
              <Badge
                variant={config.badgeVariant}
                className="capitalize flex items-center gap-1"
              >
                <Icon className="h-3 w-3" />
                {config.label}
              </Badge>
            </div>
            <CardDescription className="line-clamp-2">
              <h2 className="p-2 text-gray-200 font-md"><strong>Vertical:- </strong>{task.type}</h2>
              {task.description}
            </CardDescription>
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
              {task.submissionUrl && (
                <Dialog>
                  <DialogTrigger asChild>
                    <Button variant="outline" size="sm" className="mt-4 w-fit">
                      View Submission
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-2xl">
                    <h4 className="font-semibold mb-2">Submitted File:</h4>

                    {task.submissionFileType === "image" ? (
                      <div className="relative aspect-video w-full rounded-lg overflow-hidden border">
                        <Image
                          src={task.submissionUrl}
                          alt={`Submission for ${task.title}`}
                          layout="fill"
                          objectFit="contain"
                        />
                      </div>
                    ) : task.submissionFileType === "video" ? (
                      <video
                        controls
                        src={task.submissionUrl}
                        className="w-full rounded-lg border"
                      />
                    ) : task.submissionFileType === "pdf" ? (
                      <iframe
                        src={task.submissionUrl}
                        className="w-full h-[500px] border rounded-lg"
                        title="PDF Submission"
                      />
                    ) : task.submissionFileType === "form" ? (
                      <a
                        href={task.submissionUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 underline"
                      >
                        Open Submitted Google Form
                      </a>
                    ) : (
                      <p className="text-sm text-muted-foreground">
                        Unsupported file type
                      </p>
                    )}
                  </DialogContent>
                </Dialog>
              )}
            </div>
          </CardContent>
        </Card>
      </DialogTrigger>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <div className="flex items-center space-x-4">
            <DialogTitle className="text-2xl font-headline">
              {task.title}
            </DialogTitle>
            <Badge
              variant={config.badgeVariant}
              className="capitalize flex items-center gap-1 h-fit"
            >
              <Icon className="h-3 w-3" />
              {config.label}
            </Badge>
          </div>
        </DialogHeader>
        <ScrollArea className="max-h-[60vh] -mx-6 px-6">
          <div className="space-y-4 py-4">
            <p className="text-muted-foreground">{task.description}</p>

            {task.submissionUrl && (
              <div className="mt-4">
                <h4 className="font-semibold mb-2">Submitted File:</h4>

                {task.submissionFileType === "image" ? (
                  <div className="relative aspect-video w-full rounded-lg overflow-hidden border">
                    <Image
                      src={task.submissionUrl}
                      alt={`Submission for ${task.title}`}
                      layout="fill"
                      objectFit="contain"
                    />
                  </div>
                ) : task.submissionFileType === "video" ? (
                  <video
                    controls
                    src={task.submissionUrl}
                    className="w-full rounded-lg border"
                  />
                ) : task.submissionFileType === "pdf" ? (
                  <iframe
                    src={task.submissionUrl}
                    className="w-full h-[500px] border rounded-lg"
                    title={`PDF Submission for ${task.title}`}
                  />
                ) : task.submissionFileType === "form" ? (
                  <a
                    href={task.submissionUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 underline"
                  >
                    Open Submitted Google Form
                  </a>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    Unsupported file type
                  </p>
                )}
              </div>
            )}

            {task.reviewFeedback && (
              <div className="mt-4 space-y-4 rounded-lg border bg-muted/50 p-4">
                <h4 className="font-semibold text-lg">AI Review Feedback</h4>

                {task.reviewFeedback.rating !== undefined && (
                  <div>
                    <div className="flex items-center gap-2 text-primary">
                      <Star className="h-5 w-5" />
                      <h5 className="font-semibold">Overall Rating</h5>
                    </div>
                    <div className="mt-2 pl-7 flex items-center gap-4">
                      <Progress
                        value={task.reviewFeedback.rating * 10}
                        className="w-1/2"
                      />
                      <span className="font-bold text-lg">
                        {task.reviewFeedback.rating}/10
                      </span>
                    </div>
                    <p className="mt-1 pl-7 text-sm text-muted-foreground">
                      {task.reviewFeedback.rating >= 8
                        ? "This poster is looking great and is good to go!"
                        : "This poster needs some improvements before it's ready."}
                    </p>
                  </div>
                )}

                <div>
                  <div className="flex items-center gap-2 text-green-600 dark:text-green-500">
                    <ThumbsUp className="h-5 w-5" />
                    <h5 className="font-semibold">What went well</h5>
                  </div>
                  <pre className="mt-2 whitespace-pre-wrap font-sans text-sm text-muted-foreground pl-7">
                    {task.reviewFeedback.positive}
                  </pre>
                </div>
                <div>
                  <div className="flex items-center gap-2 text-yellow-600 dark:text-yellow-500">
                    <Lightbulb className="h-5 w-5" />
                    <h5 className="font-semibold">What to improve</h5>
                  </div>
                  <pre className="mt-2 whitespace-pre-wrap font-sans text-sm text-muted-foreground pl-7">
                    {task.reviewFeedback.negative}
                  </pre>
                </div>
              </div>
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
        </ScrollArea>
        <div className="pt-4 mt-4 border-t flex flex-col gap-4">
          {["pending", "overdue", "review", "aiApproved"].includes(
            task.status
          ) && (
            <div className="space-y-4">
              <h4 className="font-semibold text-sm">
                {task.type === "administration"
                  ? "Provide Google Form Link"
                  : `Submit ${task.type} File`}
              </h4>

              {task.type === "administration" ? (
                <Input
                  type="url"
                  placeholder="https://forms.gle/..."
                  value={selectedFile?.name || ""}
                  onChange={(e) =>
                    setSelectedFile(
                      new File(
                        [new Blob([e.target.value])],
                        "google-form-link.txt"
                      )
                    )
                  }
                />
              ) : (
                <div className="flex items-center gap-2">
                  <Input
                    type="file"
                    onChange={handleFileChange}
                    className="flex-grow"
                  />
                  <Button
                    onClick={handlePosterReview}
                    disabled={isReviewing || !selectedFile}
                  >
                    {isReviewing ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <FileUp className="mr-2 h-4 w-4" />
                    )}
                    {isReviewing ? "Uploading..." : "Upload"}
                  </Button>
                </div>
              )}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
