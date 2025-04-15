import React, { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { UserPlus, Pencil, Trash, RefreshCw } from 'lucide-react';
import MainLayout from '@/layouts/MainLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from '@/hooks/use-toast';
import { queryClient, apiRequest } from '@/lib/queryClient';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { User } from '@shared/schema';
import { UserRole, useUserRole } from '@/hooks/use-user-role';
import RoleBasedAccess from '@/components/auth/RoleBasedAccess';

// Create a schema for user form validation
const userFormSchema = z.object({
  username: z.string().min(3, {
    message: "Username must be at least 3 characters.",
  }),
  password: z.string().min(6, {
    message: "Password must be at least 6 characters.",
  }),
  email: z.string().email({
    message: "Please enter a valid email address.",
  }),
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  role: z.enum(["client", "manager", "admin"]),
  isActive: z.boolean().default(true),
  company: z.string().optional(),
  position: z.string().optional(),
});

type UserFormValues = z.infer<typeof userFormSchema>;

const AdminPage: React.FC = () => {
  const { isAdmin } = useUserRole();
  const [isUserFormOpen, setIsUserFormOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [selectedTab, setSelectedTab] = useState<string>("users");

  // Fetch users
  const { data: users = [], isLoading, refetch } = useQuery({
    queryKey: ['/api/admin/users'],
    enabled: isAdmin
  });

  // Create a form instance
  const form = useForm<UserFormValues>({
    resolver: zodResolver(userFormSchema),
    defaultValues: {
      username: '',
      password: '',
      email: '',
      firstName: '',
      lastName: '',
      role: 'client',
      isActive: true,
      company: '',
      position: '',
    },
  });

  // Create user mutation
  const createUserMutation = useMutation({
    mutationFn: async (values: UserFormValues) => {
      const res = await apiRequest('POST', '/api/admin/users', values);
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "User has been created successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/users'] });
      setIsUserFormOpen(false);
      form.reset();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create user.",
        variant: "destructive",
      });
    },
  });

  // Update user mutation
  const updateUserMutation = useMutation({
    mutationFn: async (values: UserFormValues & { id: number }) => {
      const { id, ...userData } = values;
      const res = await apiRequest('PATCH', `/api/admin/users/${id}`, userData);
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "User has been updated successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/users'] });
      setIsUserFormOpen(false);
      setSelectedUser(null);
      form.reset();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update user.",
        variant: "destructive",
      });
    },
  });

  // Delete user mutation
  const deleteUserMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await apiRequest('DELETE', `/api/admin/users/${id}`);
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "User has been deleted successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/users'] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete user.",
        variant: "destructive",
      });
    },
  });

  // Handle opening the form for editing
  const handleEditUser = (user: User) => {
    setSelectedUser(user);
    
    // Populate form with user data
    form.reset({
      username: user.username,
      password: '', // Don't show existing password, require a new one for security
      email: user.email,
      firstName: user.firstName || '',
      lastName: user.lastName || '',
      role: user.role as "client" | "manager" | "admin",
      isActive: user.isActive || true,
      company: user.company || '',
      position: user.position || '',
    });
    
    setIsUserFormOpen(true);
  };

  // Handle form submission
  const onSubmit = (values: UserFormValues) => {
    if (selectedUser) {
      updateUserMutation.mutate({ ...values, id: selectedUser.id });
    } else {
      createUserMutation.mutate(values);
    }
  };

  // Handle delete confirmation
  const handleDeleteUser = (user: User) => {
    if (confirm(`Are you sure you want to delete ${user.username}?`)) {
      deleteUserMutation.mutate(user.id);
    }
  };

  return (
    <MainLayout>
      <RoleBasedAccess allowedRoles={[UserRole.ADMIN]}>
        <div className="py-6 px-4 sm:px-6 lg:px-8">
          {/* Page Header */}
          <div className="md:flex md:items-center md:justify-between">
            <div className="flex-1 min-w-0">
              <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:text-3xl sm:truncate">
                Admin Panel
              </h2>
            </div>
            <div className="mt-4 flex md:mt-0 md:ml-4">
              <Button
                onClick={() => refetch()}
                variant="secondary"
                className="mr-2"
              >
                <RefreshCw className="mr-2 h-4 w-4" />
                Refresh
              </Button>
              <Button
                onClick={() => {
                  setSelectedUser(null);
                  form.reset({
                    username: '',
                    password: '',
                    email: '',
                    firstName: '',
                    lastName: '',
                    role: 'client',
                    isActive: true,
                    company: '',
                    position: '',
                  });
                  setIsUserFormOpen(true);
                }}
              >
                <UserPlus className="mr-2 h-4 w-4" />
                New User
              </Button>
            </div>
          </div>

          {/* Main Content */}
          <div className="mt-8">
            <Tabs value={selectedTab} onValueChange={setSelectedTab}>
              <TabsList>
                <TabsTrigger value="users">Users</TabsTrigger>
                <TabsTrigger value="settings">System Settings</TabsTrigger>
              </TabsList>
              
              <TabsContent value="users" className="space-y-4 mt-6">
                <Card>
                  <CardHeader>
                    <CardTitle>User Management</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {isLoading ? (
                      <div className="flex justify-center items-center h-40">
                        <RefreshCw className="h-8 w-8 animate-spin text-primary" />
                      </div>
                    ) : (
                      <div className="overflow-x-auto">
                        <table className="w-full table-auto">
                          <thead className="bg-gray-50">
                            <tr>
                              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Username</th>
                              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
                              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Company</th>
                              <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                            </tr>
                          </thead>
                          <tbody className="bg-white divide-y divide-gray-200">
                            {users.length === 0 ? (
                              <tr>
                                <td colSpan={6} className="px-4 py-8 text-center text-sm text-gray-500">
                                  No users found. Click "New User" to create one.
                                </td>
                              </tr>
                            ) : (
                              users.map((user: User) => (
                                <tr key={user.id}>
                                  <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">
                                    {user.username}
                                  </td>
                                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                                    {user.email}
                                  </td>
                                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                                    {user.firstName} {user.lastName}
                                  </td>
                                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                                    <div className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full 
                                      ${user.role === 'admin' ? 'bg-purple-100 text-purple-800' : 
                                        user.role === 'manager' ? 'bg-blue-100 text-blue-800' : 
                                        'bg-green-100 text-green-800'}`}>
                                      {user.role}
                                    </div>
                                  </td>
                                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                                    {user.company || '-'}
                                  </td>
                                  <td className="px-4 py-3 whitespace-nowrap text-right text-sm font-medium">
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => handleEditUser(user)}
                                      className="text-blue-600 hover:text-blue-900 mr-2"
                                    >
                                      <Pencil className="h-4 w-4" />
                                    </Button>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => handleDeleteUser(user)}
                                      className="text-red-600 hover:text-red-900"
                                    >
                                      <Trash className="h-4 w-4" />
                                    </Button>
                                  </td>
                                </tr>
                              ))
                            )}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
              
              <TabsContent value="settings" className="space-y-4 mt-6">
                <Card>
                  <CardHeader>
                    <CardTitle>System Settings</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-500">
                      System settings will be added in a future update.
                    </p>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </RoleBasedAccess>

      {/* User Form Dialog */}
      <Dialog open={isUserFormOpen} onOpenChange={setIsUserFormOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{selectedUser ? 'Edit User' : 'Create New User'}</DialogTitle>
            <DialogDescription>
              {selectedUser
                ? 'Update the user details below'
                : 'Fill in the form below to create a new user.'}
            </DialogDescription>
          </DialogHeader>
          
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="username"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Username</FormLabel>
                      <FormControl>
                        <Input placeholder="username" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input type="email" placeholder="email@example.com" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{selectedUser ? 'New Password (leave empty to keep current)' : 'Password'}</FormLabel>
                    <FormControl>
                      <Input type="password" placeholder="••••••" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="firstName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>First Name</FormLabel>
                      <FormControl>
                        <Input placeholder="John" {...field} value={field.value || ''} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="lastName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Last Name</FormLabel>
                      <FormControl>
                        <Input placeholder="Doe" {...field} value={field.value || ''} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="company"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Company</FormLabel>
                      <FormControl>
                        <Input placeholder="Acme Inc" {...field} value={field.value || ''} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="position"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Position</FormLabel>
                      <FormControl>
                        <Input placeholder="Sales Manager" {...field} value={field.value || ''} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <FormField
                control={form.control}
                name="role"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Role</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                      value={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a role" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="client">Client</SelectItem>
                        <SelectItem value="manager">Manager</SelectItem>
                        <SelectItem value="admin">Admin</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <DialogFooter>
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => setIsUserFormOpen(false)}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={createUserMutation.isPending || updateUserMutation.isPending}>
                  {selectedUser ? 'Update User' : 'Create User'}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </MainLayout>
  );
};

export default AdminPage;