"use client";

import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { Task } from '@/types';
import { db } from '@/lib/firebase';
import { collection, onSnapshot, addDoc, updateDoc, doc, query, orderBy } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';

interface TaskContextType {
  tasks: Task[];
  addTask: (task: Omit<Task, 'id'>) => void;
  updateTask: (taskId: string, updates: Partial<Task>) => void;
}

const TaskContext = createContext<TaskContextType | undefined>(undefined);

export function TaskProvider({ children }: { children: ReactNode }) {
    const [tasks, setTasks] = useState<Task[]>([]);
    const { toast } = useToast();

    useEffect(() => {
        if (!db) {
            toast({
                variant: 'destructive',
                title: 'Database Not Configured',
                description: 'Tasks cannot be loaded. Please check your Firebase credentials in .env.local',
            });
            return;
        }

        const q = query(collection(db, 'tasks'), orderBy('dueDate', 'desc'));

        const unsubscribe = onSnapshot(q, (querySnapshot) => {
            const tasksData: Task[] = [];
            querySnapshot.forEach((doc) => {
                const data = doc.data();
                const task: Task = {
                    id: doc.id,
                    title: data.title,
                    description: data.description,
                    status: data.status,
                    dueDate: data.dueDate,
                    assignee: data.assignee,
                    posterUrl: data.posterUrl,
                    reviewFeedback: data.reviewFeedback,
                };
                tasksData.push(task);
            });
            setTasks(tasksData);
        }, (error) => {
            console.error("Error fetching tasks:", error);
            toast({
                variant: "destructive",
                title: "Failed to load tasks",
                description: "Could not connect to the database to retrieve tasks.",
            });
        });

        return () => unsubscribe();
    }, [toast]);

    const addTask = (taskData: Omit<Task, 'id'>) => {
        if (!db) return;
        
        // Firestore's addDoc is async, but we don't need to wait for it.
        // The onSnapshot listener will update the UI automatically when the new data is added.
        addDoc(collection(db, 'tasks'), taskData).catch(error => {
            console.error("Error adding task:", error);
            toast({
                variant: "destructive",
                title: "Failed to create task",
                description: "The new task could not be saved to the database.",
            });
        });
    };

    const updateTask = (taskId: string, updates: Partial<Task>) => {
        if (!db) return;
        
        const taskRef = doc(db, 'tasks', taskId);
        
        // Firestore's updateDoc is async, but we don't need to wait for it.
        // The onSnapshot listener will handle the UI update reactively.
        updateDoc(taskRef, updates).catch(error => {
            console.error("Error updating task:", error);
            toast({
                variant: "destructive",
                title: "Failed to update task",
                description: "Your changes could not be saved to the database.",
            });
        });
    };

    return (
        <TaskContext.Provider value={{ tasks, addTask, updateTask }}>
            {children}
        </TaskContext.Provider>
    );
}

export function useTasks() {
    const context = useContext(TaskContext);
    if (!context) {
        throw new Error('useTasks must be used within a TaskProvider');
    }
    return context;
}
