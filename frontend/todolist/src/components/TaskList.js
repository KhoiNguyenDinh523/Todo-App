import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { tasks } from '../utils/api';
import {
  Container,
  Paper,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  TextField,
  Button,
  Typography,
  Box,
  Checkbox,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  CircularProgress,
  AppBar,
  Toolbar,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Stack,
  InputAdornment
} from '@mui/material';
import {
  Delete as DeleteIcon,
  Edit as EditIcon,
  Add as AddIcon,
  Search as SearchIcon,
  Logout as LogoutIcon,
} from '@mui/icons-material';
import { toast } from 'react-toastify';
import { debounce } from 'lodash';

const TaskList = () => {
  const navigate = useNavigate();
  const [taskList, setTaskList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [newTask, setNewTask] = useState({ title: '', description: '' });
  const [editingTask, setEditingTask] = useState(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortBy, setSortBy] = useState('createdDesc');

  // Debounce search query
  const debouncedSearch = useCallback(
    debounce((query) => {
      fetchTasks(query);
    }, 300),
    []
  );

  useEffect(() => {
    fetchTasks();
  }, [statusFilter, sortBy]);

  useEffect(() => {
    debouncedSearch(searchQuery);
  }, [searchQuery, debouncedSearch]);

  const fetchTasks = async (search = searchQuery) => {
    try {
      setLoading(true);
      const response = await tasks.getAll({
        status: statusFilter,
        sortBy,
        search
      });
      setTaskList(response.data);
      setLoading(false);
    } catch (err) {
      setError('Failed to fetch tasks');
      setLoading(false);
      if (err.response?.status === 401) {
        handleLogout();
      }
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/login');
    toast.info('Logged out successfully');
  };

  const handleCreateTask = async (e) => {
    e.preventDefault();
    try {
      const response = await tasks.create(newTask);
      setTaskList([...taskList, response.data]);
      setNewTask({ title: '', description: '' });
      toast.success('Task created successfully!');
    } catch (err) {
      toast.error('Failed to create task');
    }
  };

  const handleToggleComplete = async (taskId, completed) => {
    try {
      await tasks.toggleComplete(taskId, !completed);
      setTaskList(taskList.map(task =>
        task._id === taskId ? { ...task, completed: !completed } : task
      ));
      toast.success('Task status updated!');
    } catch (err) {
      toast.error('Failed to update task status');
    }
  };

  const handleEditClick = (task) => {
    setEditingTask(task);
    setOpenDialog(true);
  };

  const handleEditSave = async () => {
    try {
      await tasks.update(editingTask._id, editingTask);
      setTaskList(taskList.map(task =>
        task._id === editingTask._id ? editingTask : task
      ));
      setOpenDialog(false);
      toast.success('Task updated successfully!');
    } catch (err) {
      toast.error('Failed to update task');
    }
  };

  const handleDelete = async (taskId) => {
    try {
      await tasks.delete(taskId);
      setTaskList(taskList.filter(task => task._id !== taskId));
      toast.success('Task deleted successfully!');
    } catch (err) {
      toast.error('Failed to delete task');
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="100vh">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <>
      <AppBar position="static" color="primary" elevation={0}>
        <Toolbar>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            TodoManager
          </Typography>
          <Button color="inherit" onClick={handleLogout} startIcon={<LogoutIcon />}>
            Logout
          </Button>
        </Toolbar>
      </AppBar>

      <Container maxWidth="md">
        <Box sx={{ mt: 4, mb: 4 }}>
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          <Stack direction="row" spacing={2} sx={{ mb: 3 }}>
            <TextField
              fullWidth
              placeholder="Search tasks..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon />
                  </InputAdornment>
                ),
              }}
            />

            <FormControl sx={{ minWidth: 120 }}>
              <InputLabel>Status</InputLabel>
              <Select
                value={statusFilter}
                label="Status"
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <MenuItem value="all">All</MenuItem>
                <MenuItem value="completed">Completed</MenuItem>
                <MenuItem value="incomplete">Incomplete</MenuItem>
              </Select>
            </FormControl>

            <FormControl sx={{ minWidth: 120 }}>
              <InputLabel>Sort By</InputLabel>
              <Select
                value={sortBy}
                label="Sort By"
                onChange={(e) => setSortBy(e.target.value)}
              >
                <MenuItem value="createdDesc">Newest First</MenuItem>
                <MenuItem value="createdAsc">Oldest First</MenuItem>
                <MenuItem value="updatedDesc">Last Updated</MenuItem>
                <MenuItem value="updatedAsc">First Updated</MenuItem>
              </Select>
            </FormControl>
          </Stack>

          <Paper elevation={3} sx={{ p: 3, mb: 3 }}>
            <Box component="form" onSubmit={handleCreateTask}>
              <TextField
                fullWidth
                label="Task Title"
                value={newTask.title}
                onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
                required
                sx={{ mb: 2 }}
              />
              <TextField
                fullWidth
                label="Description"
                value={newTask.description}
                onChange={(e) => setNewTask({ ...newTask, description: e.target.value })}
                multiline
                rows={2}
                sx={{ mb: 2 }}
              />
              <Button
                type="submit"
                variant="contained"
                startIcon={<AddIcon />}
                fullWidth
              >
                Add Task
              </Button>
            </Box>
          </Paper>

          <Paper elevation={3}>
            <List>
              {taskList.map((task) => (
                <ListItem
                  key={task._id}
                  sx={{
                    borderBottom: '1px solid #eee',
                    '&:last-child': { borderBottom: 'none' }
                  }}
                >
                  <Checkbox
                    checked={task.completed}
                    onChange={() => handleToggleComplete(task._id, task.completed)}
                    color="primary"
                  />
                  <ListItemText
                    primary={
                      <Typography
                        variant="h6"
                        style={{
                          textDecoration: task.completed ? 'line-through' : 'none',
                          color: task.completed ? 'gray' : 'inherit'
                        }}
                      >
                        {task.title}
                      </Typography>
                    }
                    secondary={
                      <>
                        <Typography variant="body2" color="textSecondary">
                          {task.description}
                        </Typography>
                        <Typography variant="caption" color="textSecondary">
                          Created: {new Date(task.created_at).toLocaleDateString()}
                        </Typography>
                      </>
                    }
                  />
                  <ListItemSecondaryAction>
                    <IconButton
                      edge="end"
                      onClick={() => handleEditClick(task)}
                      sx={{ mr: 1 }}
                    >
                      <EditIcon />
                    </IconButton>
                    <IconButton
                      edge="end"
                      onClick={() => handleDelete(task._id)}
                    >
                      <DeleteIcon />
                    </IconButton>
                  </ListItemSecondaryAction>
                </ListItem>
              ))}
              {taskList.length === 0 && (
                <ListItem>
                  <ListItemText
                    primary={
                      <Typography align="center" color="textSecondary">
                        No tasks found
                      </Typography>
                    }
                  />
                </ListItem>
              )}
            </List>
          </Paper>

          <Dialog open={openDialog} onClose={() => setOpenDialog(false)}>
            <DialogTitle>Edit Task</DialogTitle>
            <DialogContent>
              <TextField
                fullWidth
                label="Task Title"
                value={editingTask?.title || ''}
                onChange={(e) => setEditingTask({ ...editingTask, title: e.target.value })}
                sx={{ mt: 2, mb: 2 }}
              />
              <TextField
                fullWidth
                label="Description"
                value={editingTask?.description || ''}
                onChange={(e) => setEditingTask({ ...editingTask, description: e.target.value })}
                multiline
                rows={3}
              />
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setOpenDialog(false)}>Cancel</Button>
              <Button onClick={handleEditSave} variant="contained">Save</Button>
            </DialogActions>
          </Dialog>
        </Box>
      </Container>
    </>
  );
};

export default TaskList; 