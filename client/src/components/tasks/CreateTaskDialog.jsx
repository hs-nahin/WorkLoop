import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Plus } from "lucide-react";
import { toast } from "sonner";
import { apiRequest } from "../../api/apiClient";
import { AuthContext } from "../../context/AuthContextInstance.js";
import { useContext } from "react";

export function CreateTaskDialog({ open, onOpenChange }) {
  const { user } = useContext(AuthContext);
  const [newTask, setNewTask] = useState({
    title: "",
    description: "",
    officerId: "",
    priority: "medium",
    deadline: "",
    location: "",
    assistants: [],
  });
  const [isCreating, setIsCreating] = useState(false);
  const [officers, setOfficers] = useState([]);
  const [assistants, setAssistants] = useState([]);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const usersData = await apiRequest({ endpoint: "/users" });
        const activeUsers = usersData.filter(u => u.role?.toUpperCase() !== 'ADMIN' && u.isActive !== false);
        const officerList = activeUsers.filter(u => u.role?.toUpperCase() !== 'ASSISTANT');
        const assistantList = activeUsers.filter(u => u.role?.toUpperCase() === 'ASSISTANT');
        setOfficers(officerList);
        setAssistants(assistantList);
      } catch (error) {
        toast.error("Failed to fetch users");
      }
    };
    if (open && user?.role === "ADMIN") {
      fetchUsers();
    }
  }, [open, user?.role]);

  const handleCreateTask = async (e) => {
    e.preventDefault();
    if (!newTask.title || !newTask.officerId) {
      toast.error("Please fill in required fields");
      return;
    }
    setIsCreating(true);
    try {
      await apiRequest({
        endpoint: "/tasks",
        method: "POST",
        body: {
          ...newTask,
          createdBy: user?.uid,
          status: "PENDING",
        },
      });
      toast.success("Task created successfully");
      setNewTask({
        title: "",
        description: "",
        officerId: "",
        priority: "medium",
        deadline: "",
        location: "",
        assistants: [],
      });
      onOpenChange(false);
    } catch (error) {
      toast.error(error.message || "Failed to create task");
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Create New Task</DialogTitle>
          <DialogDescription>
            Fill in the details below to create a new task.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleCreateTask} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Title *</Label>
            <Input
              id="title"
              value={newTask.title}
              onChange={(e) =>
                setNewTask({ ...newTask, title: e.target.value })
              }
              placeholder="Enter task title"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={newTask.description}
              onChange={(e) =>
                setNewTask({ ...newTask, description: e.target.value })
              }
              placeholder="Enter task description"
              rows={3}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="officer">Assign Officer *</Label>
              <Select
                value={newTask.officerId}
                onValueChange={(value) =>
                  setNewTask({ ...newTask, officerId: value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select officer">
                    {newTask.officerId ? officers.find(o => o.uid === newTask.officerId)?.name : null}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {officers.map((officer) => (
                    <SelectItem key={officer.uid} value={officer.uid}>
                      {officer.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="priority">Priority</Label>
              <Select
                value={newTask.priority}
                onValueChange={(value) =>
                  setNewTask({ ...newTask, priority: value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select priority" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="urgent">Urgent</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="deadline">Deadline</Label>
              <Input
                id="deadline"
                type="date"
                value={newTask.deadline}
                onChange={(e) =>
                  setNewTask({ ...newTask, deadline: e.target.value })
                }
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="location">Location</Label>
              <Input
                id="location"
                value={newTask.location}
                onChange={(e) =>
                  setNewTask({ ...newTask, location: e.target.value })
                }
                placeholder="Enter location"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="bg-sky-600 hover:bg-sky-700 text-white"
              disabled={isCreating}
            >
              {isCreating ? "Creating..." : "Create Task"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
