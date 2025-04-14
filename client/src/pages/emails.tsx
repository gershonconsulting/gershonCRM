import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Search, Mail, Send, Trash2, Archive, Plus, File, User, Clock } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
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
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import MainLayout from '@/layouts/MainLayout';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useToast } from '@/hooks/use-toast';
import { Contact } from '@shared/schema';
import { format } from 'date-fns';

// Email form schema
const emailFormSchema = z.object({
  to: z.number().min(1, "Recipient is required"),
  subject: z.string().min(1, "Subject is required"),
  message: z.string().min(1, "Message is required"),
});

// Mock email interface (for demonstration)
interface Email {
  id: number;
  from: string;
  to: string;
  subject: string;
  message: string;
  read: boolean;
  date: string;
  avatar?: string;
}

const EmailsPage: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedEmail, setSelectedEmail] = useState<Email | null>(null);
  const [isComposeOpen, setIsComposeOpen] = useState(false);
  const { toast } = useToast();

  // Get contacts for the recipient dropdown
  const { data: contacts = [] } = useQuery<Contact[]>({
    queryKey: ['/api/contacts'],
  });

  // Email form setup
  const form = useForm<z.infer<typeof emailFormSchema>>({
    resolver: zodResolver(emailFormSchema),
    defaultValues: {
      to: 0,
      subject: '',
      message: '',
    },
  });

  // Mock email data
  const mockEmails: Email[] = [
    {
      id: 1,
      from: 'Jane Cooper',
      to: 'you@example.com',
      subject: 'Proposal for Acme Corporation',
      message: 'Hi there,\n\nI\'ve attached the proposal for the enterprise software solution we discussed. Please let me know if you have any questions.\n\nBest,\nJane',
      read: false,
      date: '2023-08-15T14:30:00Z',
      avatar: 'https://images.unsplash.com/photo-1550525811-e5869dd03032?ixlib=rb-1.2.1&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80',
    },
    {
      id: 2,
      from: 'Michael Foster',
      to: 'you@example.com',
      subject: 'Follow-up on our meeting',
      message: 'Hello,\n\nThank you for taking the time to meet with us yesterday. I wanted to follow up on the security software implementation we discussed.\n\nRegards,\nMichael',
      read: true,
      date: '2023-08-14T10:15:00Z',
      avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?ixlib=rb-1.2.1&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80',
    },
    {
      id: 3,
      from: 'Tom Cook',
      to: 'you@example.com',
      subject: 'Cloud migration timeline',
      message: 'Hi,\n\nI wanted to discuss the timeline for the cloud migration services. Can we schedule a call this week?\n\nThanks,\nTom',
      read: true,
      date: '2023-08-13T16:45:00Z',
      avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-1.2.1&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80',
    },
  ];

  // Filter emails by search query
  const filteredEmails = mockEmails.filter(email =>
    email.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
    email.from.toLowerCase().includes(searchQuery.toLowerCase()) ||
    email.message.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Send email function (mock)
  const sendEmail = (values: z.infer<typeof emailFormSchema>) => {
    const recipient = contacts.find(c => c.id === values.to);
    
    if (!recipient) {
      toast({
        title: "Error",
        description: "Recipient not found",
        variant: "destructive",
      });
      return;
    }

    // Mock sending email
    toast({
      title: "Email sent",
      description: `Your email to ${recipient.name} has been sent.`,
    });
    
    setIsComposeOpen(false);
    form.reset();
    
    // Create activity for this email
    try {
      // In a real application, you'd call the API here
      console.log('Creating activity for email:', {
        type: 'email',
        description: `Sent email about "${values.subject}" to ${recipient.name}`,
        contactId: recipient.id,
      });
    } catch (error) {
      console.error('Failed to create activity', error);
    }
  };

  return (
    <MainLayout>
      <div className="py-6 px-4 sm:px-6 lg:px-8">
        {/* Page Header */}
        <div className="md:flex md:items-center md:justify-between">
          <div className="flex-1 min-w-0">
            <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:text-3xl sm:truncate">
              Email
            </h2>
          </div>
          <div className="mt-4 flex md:mt-0 md:ml-4">
            <Button onClick={() => setIsComposeOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Compose
            </Button>
          </div>
        </div>

        {/* Search */}
        <div className="mt-4 max-w-md">
          <div className="relative">
            <div className="pointer-events-none absolute inset-y-0 left-0 pl-3 flex items-center">
              <Search className="h-4 w-4 text-gray-400" />
            </div>
            <Input
              type="search"
              placeholder="Search emails..."
              className="pl-10"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        {/* Email Interface */}
        <div className="mt-6">
          <Card className="shadow">
            <CardHeader className="pb-3">
              <Tabs defaultValue="inbox">
                <TabsList>
                  <TabsTrigger value="inbox">Inbox</TabsTrigger>
                  <TabsTrigger value="sent">Sent</TabsTrigger>
                  <TabsTrigger value="drafts">Drafts</TabsTrigger>
                  <TabsTrigger value="archived">Archived</TabsTrigger>
                </TabsList>
              </Tabs>
            </CardHeader>
            <CardContent className="p-0">
              <div className="flex h-[600px] border-t">
                {/* Email List */}
                <div className="w-1/3 border-r overflow-auto">
                  {filteredEmails.length > 0 ? (
                    <div className="divide-y">
                      {filteredEmails.map((email) => (
                        <div
                          key={email.id}
                          className={`p-4 cursor-pointer hover:bg-gray-50 ${
                            selectedEmail?.id === email.id ? 'bg-blue-50' : ''
                          } ${!email.read ? 'font-semibold' : ''}`}
                          onClick={() => setSelectedEmail(email)}
                        >
                          <div className="flex items-start space-x-3">
                            <Avatar className="h-9 w-9">
                              {email.avatar ? (
                                <AvatarImage src={email.avatar} alt={email.from} />
                              ) : (
                                <AvatarFallback>
                                  {email.from.charAt(0)}
                                </AvatarFallback>
                              )}
                            </Avatar>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-gray-900 truncate">
                                {email.from}
                              </p>
                              <p className="text-sm text-gray-900 truncate">
                                {email.subject}
                              </p>
                              <p className="text-xs text-gray-500 truncate">
                                {email.message.substring(0, 50)}...
                              </p>
                              <p className="text-xs text-gray-500 mt-1">
                                {format(new Date(email.date), 'MMM d, h:mm a')}
                              </p>
                            </div>
                            {!email.read && (
                              <div className="w-2 h-2 bg-blue-500 rounded-full" />
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center py-20">
                      <Mail className="h-12 w-12 text-gray-300 mb-4" />
                      <p className="text-gray-500 text-sm mb-4">
                        {searchQuery
                          ? `No emails found matching "${searchQuery}"`
                          : "Your inbox is empty"}
                      </p>
                    </div>
                  )}
                </div>

                {/* Email Content */}
                <div className="w-2/3 overflow-auto">
                  {selectedEmail ? (
                    <div className="p-6">
                      <div className="flex justify-between items-start mb-6">
                        <div>
                          <h3 className="text-xl font-semibold mb-2">
                            {selectedEmail.subject}
                          </h3>
                          <div className="flex items-center space-x-2">
                            <Avatar className="h-8 w-8">
                              {selectedEmail.avatar ? (
                                <AvatarImage src={selectedEmail.avatar} alt={selectedEmail.from} />
                              ) : (
                                <AvatarFallback>
                                  {selectedEmail.from.charAt(0)}
                                </AvatarFallback>
                              )}
                            </Avatar>
                            <div>
                              <p className="text-sm font-medium">
                                {selectedEmail.from}
                              </p>
                              <p className="text-xs text-gray-500">
                                {format(new Date(selectedEmail.date), 'MMM d, yyyy h:mm a')}
                              </p>
                            </div>
                          </div>
                        </div>
                        <div className="flex space-x-2">
                          <Button variant="outline" size="sm">
                            <Archive className="h-4 w-4 mr-2" />
                            Archive
                          </Button>
                          <Button variant="outline" size="sm">
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete
                          </Button>
                        </div>
                      </div>

                      <Separator className="my-4" />

                      <div className="whitespace-pre-line text-gray-700">
                        {selectedEmail.message}
                      </div>

                      <div className="mt-6">
                        <Button onClick={() => {
                          const recipient = contacts.find(c => c.name === selectedEmail.from);
                          if (recipient) {
                            form.setValue('to', recipient.id);
                            form.setValue('subject', `Re: ${selectedEmail.subject}`);
                            setIsComposeOpen(true);
                          }
                        }}>
                          <Send className="h-4 w-4 mr-2" />
                          Reply
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center h-full">
                      <File className="h-12 w-12 text-gray-300 mb-4" />
                      <p className="text-gray-500">Select an email to read</p>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Compose Email Dialog */}
        <Dialog open={isComposeOpen} onOpenChange={setIsComposeOpen}>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>Compose Email</DialogTitle>
            </DialogHeader>
            
            <Form {...form}>
              <form onSubmit={form.handleSubmit(sendEmail)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="to"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>To</FormLabel>
                      <Select
                        onValueChange={(value) => field.onChange(parseInt(value))}
                        defaultValue={field.value ? field.value.toString() : undefined}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select recipient" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {contacts.map((contact) => (
                            <SelectItem key={contact.id} value={contact.id.toString()}>
                              {contact.name} ({contact.email})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="subject"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Subject</FormLabel>
                      <FormControl>
                        <Input placeholder="Email subject" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="message"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Message</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Write your message here..."
                          className="min-h-[200px]"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <DialogFooter>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsComposeOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button type="submit">
                    <Send className="h-4 w-4 mr-2" />
                    Send Email
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>
    </MainLayout>
  );
};

export default EmailsPage;
