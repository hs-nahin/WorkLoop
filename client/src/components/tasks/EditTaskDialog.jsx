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
import { Pencil } from "lucide-react";
import { toast } from "sonner";
import { apiRequest } from "../../api/apiClient";
import { AuthContext } from "@/context/AuthContext";
import { useContext } from "react";
import { hasPermission } from "../../lib/permissions";

export function EditTaskDialog({ open, onOpenChange, task, onTaskUpdated }) {
  const { user } = useContext(AuthContext);
  const [editedTask, setEditedTask] = useState({
    title: "",
    description: "",
    officerId: "",
    assistantId: "",
    priority: "medium",
    deadline: "",
    location: "",
  });
  const [isSaving, setIsSaving] = useState(false);
  const [officers, setOfficers] = useState([]);
  const [assistants, setAssistants] = useState([]);

  useEffect(() => {
    if (open && task) {
      setEditedTask({
        title: task.title || "",
        description: task.description || "",
        officerId: task.officerId || "",
        assistantId: task.assistantId || "",
        priority: task.priority || "medium",
        deadline: task.deadline ? new Date(task.deadline).toISOString().slice(0, 16) : "",
        location: task.location || "",
      });
    }
  }, [open, task]);

  useEffect(() => {
    if (open && hasPermission(user?.role, "TASK_EDIT")) {
      const fetchUsers = async () => {
        try {
          const usersData = await apiRequest({ endpoint: "/users" });
          const activeUsers = usersData.filter(u => u.role?.toUpperCase() !== 'ADMIN' && u.isActive !== false);
          setOfficers(activeUsers);
          setAssistants(activeUsers);
        } catch {
          toast.error("Failed to fetch users");
        }
      };
      fetchUsers();
    }
  }, [open, user?.role]);

  const handleSave = async (e) => {
    e.preventDefault();
    if (!editedTask.title || !editedTask.officerId) {
      toast.error("Please fill in required fields");
      return;
    }
    setIsSaving(true);
    try {
      await apiRequest({
        endpoint: `/tasks/${task.id}`,
        method: "PUT",
        body: {
          title: editedTask.title,
          description: editedTask.description,
          officerId: editedTask.officerId,
          assistantId: editedTask.assistantId || null,
          priority: editedTask.priority,
          deadline: editedTask.deadline || null,
          location: editedTask.location,
        },
      });
      toast.success("Task updated successfully");
      if (onTaskUpdated) onTaskUpdated();
      onOpenChange(false);
    } catch (error) {
      toast.error(error.message || "Failed to update task");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Edit Task</DialogTitle>
          <DialogDescription>
            Update the task details below.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSave} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="edit-title">Title *</Label>
            <Input
              id="edit-title"
              value={editedTask.title}
              onChange={(e) => setEditedTask({ ...editedTask, title: e.target.value })}
              placeholder="Enter task title"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-description">Description</Label>
            <Textarea
              id="edit-description"
              value={editedTask.description}
              onChange={(e) => setEditedTask({ ...editedTask, description: e.target.value })}
              placeholder="Enter task description"
              rows={3}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="edit-officer">Assign To *</Label>
              <Select
                value={editedTask.officerId}
                onValueChange={(value) => setEditedTask({ ...editedTask, officerId: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select assignee">
                    {editedTask.officerId ? officers.find(o => o.uid === editedTask.officerId)?.name : null}
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
              <Label htmlFor="edit-assistant">Collaborator</Label>
              <Select
                value={editedTask.assistantId}
                onValueChange={(value) => setEditedTask({ ...editedTask, assistantId: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select collaborator">
                    {editedTask.assistantId ? assistants.find(a => a.uid === editedTask.assistantId)?.name : null}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {assistants.map((assistant) => (
                    <SelectItem key={assistant.uid} value={assistant.uid}>
                      {assistant.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="edit-priority">Priority</Label>
              <Select
                value={editedTask.priority}
                onValueChange={(value) => setEditedTask({ ...editedTask, priority: value })}
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

            <div className="space-y-2">
              <Label htmlFor="edit-deadline">Deadline</Label>
              <Input
                id="edit-deadline"
                type="datetime-local"
                value={editedTask.deadline}
                onChange={(e) => setEditedTask({ ...editedTask, deadline: e.target.value })}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-location">Location</Label>
            <Input
              id="edit-location"
              value={editedTask.location}
              onChange={(e) => setEditedTask({ ...editedTask, location: e.target.value })}
              placeholder="Enter location"
            />
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
              disabled={isSaving}
            >
              {isSaving ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}