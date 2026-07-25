import { apiRequest } from "@/api/apiClient";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  ArrowLeft,
  Eye,
  EyeOff,
  Loader2,
  Plus,
  Search,
  Shield,
  ShieldOff,
  Trash2,
  UserPlus,
  Users,
  Pencil,
  KeyRound,
} from "lucide-react";
import { useContext, useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router";
import { toast } from "sonner";
import { AuthContext } from "@/context/AuthContextInstance";

const UserManagement = () => {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();

  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterLocation, setFilterLocation] = useState("all");
  const [filterDesignation, setFilterDesignation] = useState("all");

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [isResetOpen, setIsResetOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);

  const [createForm, setCreateForm] = useState({
    name: "", userId: "", password: "", location: "", designation: "", displayId: ""
  });
  const [editForm, setEditForm] = useState({
    name: "", displayId: "", location: "", designation: ""
  });
  const [resetPassword, setResetPassword] = useState("");
  const [showCreatePassword, setShowCreatePassword] = useState(false);
  const [showResetPassword, setShowResetPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const data = await apiRequest({ endpoint: "/auth/users" });
      setUsers(data);
    } catch (error) {
      console.error("Failed to fetch users:", error);
      toast.error("Failed to load users");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const locations = useMemo(() => {
    const set = new Set(users.map(u => u.location).filter(Boolean));
    return [...set].sort();
  }, [users]);

  const designations = useMemo(() => {
    const set = new Set(users.map(u => u.designation).filter(Boolean));
    return [...set].sort();
  }, [users]);

  const filteredUsers = useMemo(() => {
    return users.filter(u => {
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        if (!(u.name || "").toLowerCase().includes(q) &&
            !(u.userId || "").toLowerCase().includes(q) &&
            !(u.email || "").toLowerCase().includes(q)) {
          return false;
        }
      }
      if (filterLocation !== "all" && u.location !== filterLocation) return false;
      if (filterDesignation !== "all" && u.designation !== filterDesignation) return false;
      return true;
    });
  }, [users, searchQuery, filterLocation, filterDesignation]);

  const handleCreate = async () => {
    if (!createForm.name.trim()) return toast.error("Full name is required");
    if (!createForm.userId.trim()) return toast.error("User ID is required");
    if (!createForm.password.trim()) return toast.error("Password is required");
    if (createForm.password.length < 6) return toast.error("Password must be at least 6 characters");
    if (!/^[a-zA-Z0-9._-]+$/.test(createForm.userId)) {
      return toast.error("User ID can only contain letters, numbers, dots, hyphens, and underscores");
    }

    setSubmitting(true);
    try {
      await apiRequest({
        endpoint: "/auth/create-user",
        method: "POST",
        body: {
          name: createForm.name.trim(),
          userId: createForm.userId.trim(),
          password: createForm.password,
          location: createForm.location.trim(),
          designation: createForm.designation.trim(),
          displayId: createForm.displayId.trim() || createForm.userId.trim(),
        },
      });
      toast.success("User created successfully");
      setIsCreateOpen(false);
      setCreateForm({ name: "", userId: "", password: "", location: "", designation: "", displayId: "" });
      fetchUsers();
    } catch (error) {
      toast.error(error.message || "Failed to create user");
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = async () => {
    if (!editForm.name.trim()) return toast.error("Full name is required");

    setSubmitting(true);
    try {
      await apiRequest({
        endpoint: `/auth/update-user/${selectedUser.uid}`,
        method: "PUT",
        body: {
          name: editForm.name.trim(),
          displayId: editForm.displayId.trim(),
          location: editForm.location.trim(),
          designation: editForm.designation.trim(),
        },
      });
      toast.success("User updated successfully");
      setIsEditOpen(false);
      setSelectedUser(null);
      fetchUsers();
    } catch (error) {
      toast.error(error.message || "Failed to update user");
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggle = async (u) => {
    try {
      await apiRequest({
        endpoint: `/auth/toggle-user/${u.uid}`,
        method: "PATCH",
      });
      toast.success(`User ${u.isActive ? "deactivated" : "activated"} successfully`);
      fetchUsers();
    } catch (error) {
      toast.error(error.message || "Failed to toggle user");
    }
  };

  const handleDelete = async () => {
    setSubmitting(true);
    try {
      await apiRequest({
        endpoint: `/auth/delete-user/${selectedUser.uid}`,
        method: "DELETE",
      });
      toast.success("User deleted successfully");
      setIsDeleteOpen(false);
      setSelectedUser(null);
      fetchUsers();
    } catch (error) {
      toast.error(error.message || "Failed to delete user");
    } finally {
      setSubmitting(false);
    }
  };

  const handleResetPassword = async () => {
    if (!resetPassword.trim()) return toast.error("New password is required");
    if (resetPassword.length < 6) return toast.error("Password must be at least 6 characters");

    setSubmitting(true);
    try {
      await apiRequest({
        endpoint: `/auth/reset-password/${selectedUser.uid}`,
        method: "PATCH",
        body: { newPassword: resetPassword },
      });
      toast.success("Password reset successfully");
      setIsResetOpen(false);
      setSelectedUser(null);
      setResetPassword("");
    } catch (error) {
      toast.error(error.message || "Failed to reset password");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <header className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate("/admin/dashboard")} className="cursor-pointer">
          <ArrowLeft size={18} />
        </Button>
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight">User Management</h1>
          <p className="text-muted-foreground mt-1">Create, edit, and manage employee accounts</p>
        </div>
      </header>

      <Card className="border-border bg-card/50 backdrop-blur-sm">
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Users size={18} />
                Employee Accounts
              </CardTitle>
              <CardDescription>{users.length} total users registered</CardDescription>
            </div>
            <Button onClick={() => setIsCreateOpen(true)} className="flex items-center gap-2 cursor-pointer">
              <UserPlus size={16} />
              Create User
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-3 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
              <Input
                placeholder="Search by name, User ID, or email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={filterLocation} onValueChange={setFilterLocation}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder="All Sheds" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Sheds</SelectItem>
                {locations.map(loc => (
                  <SelectItem key={loc} value={loc}>{loc}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={filterDesignation} onValueChange={setFilterDesignation}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder="All Designations" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Designations</SelectItem>
                {designations.map(des => (
                  <SelectItem key={des} value={des}>{des}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Users size={40} className="mx-auto mb-3 opacity-50" />
              <p className="text-sm font-medium">No users found</p>
              <p className="text-xs mt-1">
                {users.length === 0
                  ? "Create your first user account to get started"
                  : "Try adjusting your search or filters"}
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {filteredUsers.map((u) => (
                <div
                  key={u.uid}
                  className={`flex items-center gap-3 sm:gap-4 p-3 sm:p-4 rounded-lg border transition-colors ${
                    u.isActive === false
                      ? "opacity-50 border-dashed"
                      : "hover:bg-accent/50"
                  }`}
                >
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold shrink-0 ${
                    u.role === "ADMIN"
                      ? "bg-red-400/20 text-red-400"
                      : "bg-sky-400/20 text-sky-400"
                  }`}>
                    {u.role === "ADMIN" ? <Shield size={16} /> : (u.name?.charAt(0) || "U")}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-sm font-medium truncate">{u.name}</p>
                      {u.role === "ADMIN" && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-red-500/10 text-red-500 font-medium">Admin</span>
                      )}
                      {u.isActive === false && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-yellow-500/10 text-yellow-500 font-medium">Disabled</span>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground truncate">
                      ID: {u.userId} {u.email ? `• ${u.email}` : ""}
                    </p>
                    <div className="flex items-center gap-2 mt-0.5 text-[11px] text-muted-foreground">
                      {u.location && <span>{u.location}</span>}
                      {u.location && u.designation && <span>•</span>}
                      {u.designation && <span>{u.designation}</span>}
                    </div>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 cursor-pointer"
                      title="Edit user"
                      onClick={() => {
                        setSelectedUser(u);
                        setEditForm({
                          name: u.name || "",
                          displayId: u.displayId || "",
                          location: u.location || "",
                          designation: u.designation || "",
                        });
                        setIsEditOpen(true);
                      }}
                    >
                      <Pencil size={14} />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 cursor-pointer"
                      title="Reset password"
                      onClick={() => {
                        setSelectedUser(u);
                        setResetPassword("");
                        setIsResetOpen(true);
                      }}
                    >
                      <KeyRound size={14} />
                    </Button>
                    {u.role !== "ADMIN" && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className={`h-8 w-8 cursor-pointer ${u.isActive !== false ? "text-yellow-500 hover:text-yellow-600" : "text-green-500 hover:text-green-600"}`}
                        title={u.isActive !== false ? "Deactivate" : "Activate"}
                        onClick={() => handleToggle(u)}
                      >
                        {u.isActive !== false ? <ShieldOff size={14} /> : <Shield size={14} />}
                      </Button>
                    )}
                    {u.role !== "ADMIN" && !u.isSystemAdmin && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-destructive hover:text-destructive cursor-pointer"
                        title="Delete user"
                        onClick={() => {
                          setSelectedUser(u);
                          setIsDeleteOpen(true);
                        }}
                      >
                        <Trash2 size={14} />
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create User Dialog */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold">Create New User</DialogTitle>
            <DialogDescription>
              Create an employee account. They will log in with their User ID.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-2">
            <div className="grid gap-2">
              <Label htmlFor="create-name">Full Name *</Label>
              <Input
                id="create-name"
                placeholder="John Doe"
                value={createForm.name}
                onChange={(e) => setCreateForm({ ...createForm, name: e.target.value })}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="create-userId">User ID *</Label>
              <Input
                id="create-userId"
                placeholder="john.doe"
                value={createForm.userId}
                onChange={(e) => setCreateForm({ ...createForm, userId: e.target.value })}
              />
              <p className="text-[11px] text-muted-foreground">This will be used to log in. Letters, numbers, dots, hyphens only.</p>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="create-password">Password *</Label>
              <div className="relative">
                <Input
                  id="create-password"
                  type={showCreatePassword ? "text" : "password"}
                  placeholder="Minimum 6 characters"
                  value={createForm.password}
                  onChange={(e) => setCreateForm({ ...createForm, password: e.target.value })}
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowCreatePassword(!showCreatePassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground p-1"
                >
                  {showCreatePassword ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="create-location">Shed / Location</Label>
                <Input
                  id="create-location"
                  placeholder="Shed-01"
                  value={createForm.location}
                  onChange={(e) => setCreateForm({ ...createForm, location: e.target.value })}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="create-designation">Designation</Label>
                <Input
                  id="create-designation"
                  placeholder="IT Officer"
                  value={createForm.designation}
                  onChange={(e) => setCreateForm({ ...createForm, designation: e.target.value })}
                />
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="create-displayId">Display ID (optional)</Label>
              <Input
                id="create-displayId"
                placeholder="EMP-001"
                value={createForm.displayId}
                onChange={(e) => setCreateForm({ ...createForm, displayId: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateOpen(false)} className="cursor-pointer">Cancel</Button>
            <Button onClick={handleCreate} disabled={submitting} className="cursor-pointer">
              {submitting ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Creating...</> : "Create User"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit User Dialog */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold">Edit User</DialogTitle>
            <DialogDescription>
              Update user information for {selectedUser?.name}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-2">
            <div className="grid gap-2">
              <Label htmlFor="edit-name">Full Name</Label>
              <Input
                id="edit-name"
                value={editForm.name}
                onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-displayId">Display ID</Label>
              <Input
                id="edit-displayId"
                value={editForm.displayId}
                onChange={(e) => setEditForm({ ...editForm, displayId: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="edit-location">Shed / Location</Label>
                <Input
                  id="edit-location"
                  value={editForm.location}
                  onChange={(e) => setEditForm({ ...editForm, location: e.target.value })}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-designation">Designation</Label>
                <Input
                  id="edit-designation"
                  value={editForm.designation}
                  onChange={(e) => setEditForm({ ...editForm, designation: e.target.value })}
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditOpen(false)} className="cursor-pointer">Cancel</Button>
            <Button onClick={handleEdit} disabled={submitting} className="cursor-pointer">
              {submitting ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving...</> : "Save Changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reset Password Dialog */}
      <Dialog open={isResetOpen} onOpenChange={setIsResetOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold">Reset Password</DialogTitle>
            <DialogDescription>
              Set a new password for {selectedUser?.name}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-2 py-2">
            <Label htmlFor="reset-password">New Password</Label>
            <div className="relative">
              <Input
                id="reset-password"
                type={showResetPassword ? "text" : "password"}
                placeholder="Minimum 6 characters"
                value={resetPassword}
                onChange={(e) => setResetPassword(e.target.value)}
                className="pr-10"
              />
              <button
                type="button"
                onClick={() => setShowResetPassword(!showResetPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground p-1"
              >
                {showResetPassword ? <EyeOff size={14} /> : <Eye size={14} />}
              </button>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsResetOpen(false)} className="cursor-pointer">Cancel</Button>
            <Button onClick={handleResetPassword} disabled={submitting} className="cursor-pointer">
              {submitting ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Resetting...</> : "Reset Password"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete User Dialog */}
      <Dialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-destructive">Delete User</DialogTitle>
            <DialogDescription>
              This will permanently delete <strong>{selectedUser?.name}</strong> and remove their access.
              This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteOpen(false)} className="cursor-pointer">Cancel</Button>
            <Button variant="destructive" onClick={handleDelete} disabled={submitting} className="cursor-pointer">
              {submitting ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Deleting...</> : "Delete User"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default UserManagement;
