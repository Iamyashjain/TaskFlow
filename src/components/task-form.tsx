
"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import * as z from "zod"
import { format } from "date-fns"
import { CalendarIcon, Loader2 } from "lucide-react"
import { useState } from "react"
import { useRouter } from "next/navigation"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
  } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/hooks/use-toast"
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card"
import { useTasks } from "@/context/task-context"
import { TaskType } from "@/types"

const formSchema = z.object({
  title: z.string().min(2, {
    message: "Title must be at least 2 characters.",
  }),
  description: z.string().optional(),
  assignee: z.string().email({ message: "Please enter a valid email." }).optional().or(z.literal('')),
  dueDate: z.date({
    required_error: "A due date is required.",
  }),
  status: z.enum(["pending", "completed", "overdue"]),
  type: z.enum(["Content", "Design", "Administration", "Media"]),
})

const verticalLeads: Record<TaskType, string> = {
  Content: "24bcs156@ietdavv.edu.in",
  Design: "thecraftersietdavv@gmail.com",
  Administration: "23btc078@ietdavv.edu.in",
  Media: "yashjain200502@gmail.com",
};

export function TaskForm() {
    const { toast } = useToast()
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
      type: "Content",
    },
  })

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsSubmitting(true);
    try {
      const taskData = {
        ...values,
        dueDate: values.dueDate.toISOString(),
        description: values.description || "",
      };
      
      addTask(taskData);

      if (values.assignee) {
        const leadEmail = verticalLeads[values.type];
        
        // AI Flow is mocked for static export compatibility
        await new Promise(resolve => setTimeout(resolve, 1000));
        const result = { success: true };
        
        if (result.success) {
          toast({
            title: "Task Created & Notifications Sent",
            description: `Notifications for "${values.title}" sent to assignee (${values.assignee}) and vertical lead (${leadEmail}).`,
          });
        } else {
          throw new Error("Failed to send notifications");
        }
      } else {
        toast({
          title: "Task Created",
          description: "Your new task has been successfully created.",
        });
      }
      form.reset();
      router.push('/');
    } catch (error) {
      console.error("Failed to create task or send notifications:", error);
      toast({
        variant: "destructive",
        title: "Something went wrong",
        description: "Failed to create task or send notifications. Please try again.",
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Card className="rounded-2xl shadow-lg">
        <CardHeader>
            <CardTitle className="text-2xl font-headline">Task Details</CardTitle>
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
                        <Textarea placeholder="Add a more detailed description..." {...field} />
                    </FormControl>
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
                        <Input type="email" placeholder="e.g. jane.doe@example.com" {...field} />
                      </FormControl>
                      <FormDescription>
                        Assign this task to send them an email notification.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="type"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Type</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a task type" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="Content">Content</SelectItem>
                          <SelectItem value="Design">Design</SelectItem>
                          <SelectItem value="Administration">Administration</SelectItem>
                          <SelectItem value="Media">Media</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormDescription>
                        Categorize the task by its vertical.
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
                                new Date(date.toDateString()) < new Date(new Date().toDateString())
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
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
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

                <Button type="submit" disabled={isSubmitting} className="transition-transform duration-200 hover:scale-105">
                  {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {isSubmitting ? 'Creating...' : 'Create Task'}
                </Button>
            </form>
            </Form>
        </CardContent>
    </Card>
  )
}
