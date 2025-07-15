"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { format } from "date-fns";
import { CalendarIcon, Loader2 } from "lucide-react";
import { useState } from "react";
import { useRouter } from "next/navigation";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { sendReminder } from "@/ai/flows/send-reminder-flow"; // ✅ safe import

import { useTasks } from "@/context/task-context";

const verticalLeads = {
  content: "rudrajabalpur1112@gmail.com", // Replace with actual lead emails
  design: "rudrajabalpur1112@gmail.com", // Replace with actual lead emails
  administration: "rudrajabalpur1112@gmail.com", // Replace with actual lead emails
  media: "rudrajabalpur1112@gmail.com", // Replace with actual lead emails
};

const formSchema = z.object({
  title: z.string().min(2, {
    message: "Title must be at least 2 characters.",
  }),
  description: z.string().optional(),
  assignee: z
    .string()
    .email({ message: "Please enter a valid email." })
    .optional()
    .or(z.literal("")),
  dueDate: z.date({
    required_error: "A due date is required.",
  }),
  status: z.enum(["pending", "completed", "overdue"]),
  type: z.enum(["content", "design", "administration", "media"], {
    required_error: "Please select a task type.",
  }),
});

export function TaskForm() {
  const { toast } = useToast();
  const router = useRouter();
  const { addTask } = useTasks();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "",
      description: "",
      assignee: "",
      status: "pending",
      type: "content",
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsSubmitting(true);
    try {
      const taskData = {
        ...values,
        dueDate: values.dueDate.toISOString(),
        description: values.description || "",
        type: values.type.toLowerCase(), // Ensure type is lowercase
      };

      addTask(taskData);

      if (values.assignee) {
        const typeKey = values.type.toLowerCase(); // Ensure consistent key matching
        const leadEmail = verticalLeads[typeKey];

        // Send reminder to assignee
        const assigneeResult = await sendReminder({
          title: values.title,
          description: values.description,
          dueDate: values.dueDate.toISOString(),
          assignee: values.assignee,
          reminderType: "assignment",
        });

        // Send reminder to vertical lead
        const leadResult = await sendReminder({
          title: values.title,
          description: values.description,
          dueDate: values.dueDate.toISOString(),
          assignee: leadEmail, // Send to the lead
          reminderType: "assignment", // You might want a different reminder type here
        });

        if (assigneeResult.success && leadResult.success) {
          toast({
            title: "Task Created & Notifications Sent",
            description: `Assignment notifications for "${values.title}" were sent to ${values.assignee} and the ${values.type} vertical lead (${leadEmail}).`,
          });
        } else {
          // Handle cases where one or both reminders failed
          throw new Error(
            assigneeResult.message ||
              leadResult.message ||
              "Failed to send one or more reminders."
          );
        }
      } else {
        toast({
          title: "Task Created",
          description: "Your new task has been successfully created.",
        });
      }
      form.reset();
      router.push("/");
    } catch (error) {
      console.error("Failed to create task or send reminder:", error);
      toast({
        variant: "destructive",
        title: "Something went wrong",
        description:
          "Failed to create task or notify assignee. Please try again.",
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Card className="rounded-2xl shadow-lg">
      <CardHeader>
        <CardTitle className="text-2xl font-headline">
          Create a New Task
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Title</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g. Design a new logo" {...field} />
                  </FormControl>
                  <FormDescription>
                    This is the title of your task.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Add a more detailed description..."
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Task Type</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger className="bg-gray
                       border border-gray-300 shadow-sm hover:border-gray-400">
                        <SelectValue placeholder="Select task type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="content">📄 Content</SelectItem>
                      <SelectItem value="design">🎨 Design</SelectItem>
                      <SelectItem value="administration">
                        🗂️ Administration
                      </SelectItem>
                      <SelectItem value="media">📸 Media</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    Select the category for this task.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="assignee"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Assignee Email (Optional)</FormLabel>
                  <FormControl>
                    <Input
                      type="email"
                      placeholder="e.g. jane.doe@example.com"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    Assign this task to someone to send them an email
                    notification.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <FormField
                control={form.control}
                name="dueDate"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Due Date</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant={"outline"}
                            className={cn(
                              "w-full pl-3 text-left font-normal",
                              !field.value && "text-muted-foreground"
                            )}
                          >
                            {field.value ? (
                              format(field.value, "PPP")
                            ) : (
                              <span>Pick a date</span>
                            )}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={field.value}
                          onSelect={field.onChange}
                          disabled={(date) =>
                            date < new Date() || date < new Date("1900-01-01")
                          }
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Status</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a status" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="pending">Pending</SelectItem>
                        <SelectItem value="completed">Completed</SelectItem>
                        <SelectItem value="overdue">Overdue</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <Button
              type="submit"
              disabled={isSubmitting}
              className="transition-transform duration-200 hover:scale-105"
            >
              {isSubmitting && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              {isSubmitting ? "Creating..." : "Create Task & Go to Dashboard"}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
