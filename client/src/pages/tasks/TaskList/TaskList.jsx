import React, { useContext, useEffect, useState } from 'react';
import { useNavigate } from 'react-router';
import { apiRequest } from '../../../api/apiClient';
import { 
  Plus, 
  Search, 
  Calendar, 
  User as UserIcon, 
  ArrowRight,
  AlertCircle,
  CheckCircle2,
  Clock
} from 'lucide-react';
import { AuthContext } from '../../../context/AuthContextInstance.js';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import BlurFade from '../../../components/animations/BlurFade';
import TextHighlighter from '../../../components/animations/TextHighlighter';
import GradientText from '../../../components/animations/GradientText';

const TaskList = () => {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  const [tasks, setTasks] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [newTask, setNewTask] = useState({ title: '', description: '', officerId: '', priority: 'medium', deadline: '', location: '' });
  const [isCreating, setIsCreating] = useState(false);

  useEffect(() => {
    const fetchTasks = async () => {
      try {
        setIsLoading(true);
        const data = await apiRequest({ endpoint: '/tasks' });
        setTasks(data);
      } catch (error) {
        toast.error('Failed to fetch tasks');
      } finally {
        setIsLoading(false);
      }
    };
    fetchTasks();
  }, []);

  const handleCreateTask = async () => {
    if (!newTask.title || !newTask.description) {
      toast.error('Title and Description are required');
      return;
    }
    try {
      setIsCreating(true);
      const createdTask = await apiRequest({ 
        endpoint: '/tasks', 
        method: 'POST', 
        body: newTask 
      });
      setTasks([createdTask, ...tasks]);
      setIsModalOpen(false);
      setNewTask({ title: '', description: '', officerId: '', priority: 'medium', deadline: '', location: '' });
      toast.success('Task deployed successfully');
    } catch (error) {
      toast.error(error.message || 'Creation failed');
    } finally {
      setIsCreating(false);
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'completed': return <<BadgeBadge className="bg-green-500/10 text-green-500 border-green-500/20 hover:bg-green-500/20"><<CheckCheckCircle2 size={12} className="mr-1" /> Completed</Badge>;
      case 'pending': return <<BadgeBadge className="bg-yellow-500/10 text-yellow-500 border-yellow-500/20 hover:bg-yellow-500/20"><<ClockClock size={12} className="mr-1" /> Pending</Badge>;
      case 'rejected': return <<BadgeBadge className="bg-destructive/10 text-destructive border-destructive/20 hover:bg-destructive/20"><<AlertAlertCircle size={12} className="mr-1" /> Rejected</Badge>;
      default: return <<BadgeBadge variant="outline">{status}</Badge>;
    }
  };

  const filteredTasks = tasks.filter(t => 
    t.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
    t.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <<divdiv className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <<headerheader className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <<divdiv className="space-y-1">
          <<TextTextHighlighter text="Task Repository" className="text-3xl font-bold tracking-tight" />
          <<GradientGradientText text="Track, assign and monitor internal IT operations" className="text-sm opacity-70 block" />
        </div
        
        <<divdiv className="flex items-center gap-3">
          <<divdiv className="relative w-full md:w-64">
            <<SearchSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
            <<InputInput 
              placeholder="Search operations..." 
              className="pl-9"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          {user?.role === 'ADMIN' && (
            <<DialogDialog open={isModalOpen} onOpenChange={setIsModalOpen}>
              <<DialogDialogTrigger asChild>
                <<ButtonButton className="gap-2">
                  <<PlusPlus size={18} />
                  <span>New Task</span>
                </Button>
              </DialogTrigger>
              <<DialogDialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
                <<DialogDialogHeader>
                  <<DialogDialogTitle className="text-xl font-bold">Initialize New Task</DialogTitle>
                  <<DialogDialogDescription>Define the requirements for a new IT operation.</DialogDescription>
                </DialogHeader>
                <<divdiv className="grid gap-6 py-4">
                  <<divdiv className="grid gap-2">
                    <<LabelLabel htmlFor="title">Task Title</Label>
                    <<InputInput 
                      id="title"
                      placeholder="e.g. Network Migration" 
                      value={newTask.title}
                      onChange={(e) => setNewTask({...newTask, title: e.target.value})}
                    />
                  </div>
                  <<divdiv className="grid gap-2">
                    <<LabelLabel htmlFor="description">Detailed Requirement</Label>
                    <<TextTextarea 
                      id="description"
                      placeholder="Describe the operational goal..." 
                      value={newTask.description}
                      onChange={(e) => setNewTask({...newTask, description: e.target.value})}
                      className="min-h-[120px]"
                    />
                  </div>
                  <<divdiv className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <<divdiv className="grid gap-2">
                      <<LabelLabel htmlFor="officer">Assign IT Officer (ID)</Label>
                      <<InputInput 
                        id="officer"
                        placeholder="USER_ID" 
                        value={newTask.officerId}
                        onChange={(e) => setNewTask({...newTask, officerId: e.target.value})}
                      />
                    </div>
                    <<divdiv className="grid gap-2">
                      <<LabelLabel htmlFor="priority">Priority Level</Label>
                      <<SelectSelect 
                        value={newTask.priority} 
                        onValueChange={(v) => setNewTask({...newTask, priority: v})}
                      >
                        <<SelectSelectTrigger id="priority">
                          <<SelectSelectValue placeholder="Select Priority" />
                        </SelectTrigger>
                        <<SelectSelectContent>
                          <<SelectItemSelectItem value="low">Low</SelectItem>
                          <<SelectItemSelectItem value="medium">Medium</SelectItem>
                          <<SelectItemSelectItem value="high">High</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <<divdiv className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <<divdiv className="grid gap-2">
                      <<LabelLabel htmlFor="deadline">Deadline</Label>
                      <<InputInput 
                        id="deadline"
                        type="date"
                        value={newTask.deadline}
                        onChange={(e) => setNewTask({...newTask, deadline: e.target.value})}
                      />
                    </div>
                    <<divdiv className="grid gap-2">
                      <<LabelLabel htmlFor="location">Physical Location</Label>
                      <<InputInput 
                        id="location"
                        placeholder="Office/Floor/Room" 
                        value={newTask.location}
                        onChange={(e) => setNewTask({...newTask, location: e.target.value})}
                      />
                    </div>
                  </div>
                </div>
                <<DialogDialogFooter>
                  <<ButtonButton variant="outline" onClick={() => setIsModalOpen(false)}>Cancel</Button>
                  <<ButtonButton onClick={handleCreateTask} disabled={isCreating}>
                    {isCreating ? <<>><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Deploying...</> : 'Confirm Deployment'}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          )}
        </div
      </header>

      {isLoading ? (
        <<divdiv className="flex flex-col justify-center items-center h-64 gap-4">
          <<divdiv className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          <<pp className="text-sm text-muted-foreground animate-pulse">Fetching repository data...</p>
        </div>
      ) : (
        <<divdiv className="rounded-xl border bg-card/50 backdrop-blur-sm overflow-hidden">
          <<divdiv className="overflow-x-auto">
            <<TableTable>
              <<TableHeaderTableHeader className="bg-muted/50">
                <<TableRowTableRow>
                  <<TableTableHead className="w-[300px]">Task Information</TableHead>
                  <<TableTableHead>Status</TableHead>
                  <<TableTableHead>Priority</TableHead>
                  <<TableTableHead>Assigned To</TableHead>
                  <<TableTableHead>Deadline</TableHead>
                  <<TableTableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <<TableTableBody>
                {filteredTasks.map((task, index) => (
                  <<BlurBlurFade key={task.id} delay={index * 20}>
                    <<TableRowTableRow className="group hover:bg-accent/50 transition-colors cursor-pointer" onClick={() => navigate(`/tasks/${task.id}`)}>
                      <<TableCellTableCell>
                        <<divdiv className="flex flex-col gap-1">
                          <<spanspan className="font-semibold text-foreground group-hover:text-primary transition-colors">
                            {task.title}
                          </span>
                          <<spanspan className="text-xs text-muted-foreground line-clamp-1 max-w-xs">
                            {task.description}
                          </span>
                        </div>
                      </TableCell>
                      <<TableCellTableCell>
                        {getStatusBadge(task.status)}
                      </TableCell>
                      <<TableCellTableCell>
                        <<divdiv className="flex items-center gap-2 text-xs font-medium uppercase">
                          <<divdiv className={cn(
                            "w-2 h-2 rounded-full",
                            task.priority === 'high' ? "bg-destructive" : task.priority === 'medium' ? "bg-yellow-500" : "bg-green-500"
                          )} />
                          {task.priority}
                        </div>
                      </TableCell>
                      <<TableCellTableCell>
                        <<divdiv className="flex items-center gap-2">
                          <<divdiv className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-[10px] font-bold text-primary border border-primary/20">
                            {task.assignedTo?.name?.charAt(0) || 'U'}
                          </div>
                          <<spanspan className="text-sm">{task.assignedTo?.name || 'Unassigned'}</span>
                        </div>
                      </TableCell>
                      <<TableCellTableCell>
                        <<divdiv className="flex items-center gap-2 text-sm text-muted-foreground">
                          <<CalendarCalendar size={14} />
                          {task.deadline || 'No deadline'}
                        </div>
                      </TableCell>
                      <<TableCellTableCell className="text-right">
                        <<ButtonButton variant="ghost" size="sm" className="p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
                          <<ArrowArrowRight size={16} />
                        </Button>
                      </TableCell>
                    </TableRow>
                  </BlurFade>
                ))}
                {filteredTasks.length === 0 && (
                  <<TableRowTableRow>
                    <<TableCellTableCell colSpan={6} className="h-64 text-center text-muted-foreground italic">
                      No tasks matching your search criteria.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </div>
      )}
    </div>
  );
};

import { cn } from '@/lib/utils';
import { Loader2 } from 'lucide-react';

export default TaskList;
