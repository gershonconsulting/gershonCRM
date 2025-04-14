import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Plus, Search, Mail, Phone, Building, User, MoreHorizontal, UserPlus } from 'lucide-react';
import MainLayout from '@/layouts/MainLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import ContactForm from '@/components/contacts/ContactForm';
import { Contact } from '@shared/schema';
import { useToast } from '@/hooks/use-toast';
import { apiRequest, queryClient } from '@/lib/queryClient';

const ContactsPage: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const { toast } = useToast();

  // Fetch contacts
  const { data: contacts = [], isLoading } = useQuery<Contact[]>({
    queryKey: ['/api/contacts'],
  });

  // Filter contacts by search query
  const filteredContacts = contacts.filter(contact => 
    contact.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    contact.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (contact.company && contact.company.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const handleEditContact = (contact: Contact) => {
    setSelectedContact(contact);
    setIsFormOpen(true);
  };

  const handleDeleteContact = async (contact: Contact) => {
    if (window.confirm(`Are you sure you want to delete ${contact.name}?`)) {
      try {
        await apiRequest('DELETE', `/api/contacts/${contact.id}`);
        queryClient.invalidateQueries({ queryKey: ['/api/contacts'] });
        toast({
          title: "Contact deleted",
          description: `${contact.name} has been deleted successfully.`,
        });
      } catch (error) {
        toast({
          title: "Error",
          description: `Failed to delete contact: ${error}`,
          variant: "destructive",
        });
      }
    }
  };

  return (
    <MainLayout>
      <div className="py-6 px-4 sm:px-6 lg:px-8">
        {/* Page Header */}
        <div className="md:flex md:items-center md:justify-between">
          <div className="flex-1 min-w-0">
            <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:text-3xl sm:truncate">
              Contacts
            </h2>
          </div>
          <div className="mt-4 flex md:mt-0 md:ml-4">
            <Button 
              onClick={() => {
                setSelectedContact(null);
                setIsFormOpen(true);
              }}
            >
              <Plus className="mr-2 h-4 w-4" />
              Add Contact
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
              placeholder="Search contacts..."
              className="pl-10"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        {/* Contacts Table */}
        <div className="mt-6 flex flex-col">
          <div className="-my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
            <div className="py-2 align-middle inline-block min-w-full sm:px-6 lg:px-8">
              <div className="shadow overflow-hidden border-b border-gray-200 sm:rounded-lg">
                {isLoading ? (
                  <div className="bg-white px-4 py-20 text-center">
                    <p>Loading contacts...</p>
                  </div>
                ) : filteredContacts.length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Phone</TableHead>
                        <TableHead>Company</TableHead>
                        <TableHead>Position</TableHead>
                        <TableHead className="w-[80px]"></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredContacts.map((contact) => (
                        <TableRow key={contact.id}>
                          <TableCell className="font-medium">{contact.name}</TableCell>
                          <TableCell className="flex items-center">
                            <Mail className="h-4 w-4 mr-2 text-gray-400" />
                            {contact.email}
                          </TableCell>
                          <TableCell>
                            {contact.phone && (
                              <div className="flex items-center">
                                <Phone className="h-4 w-4 mr-2 text-gray-400" />
                                {contact.phone}
                              </div>
                            )}
                          </TableCell>
                          <TableCell>
                            {contact.company && (
                              <div className="flex items-center">
                                <Building className="h-4 w-4 mr-2 text-gray-400" />
                                {contact.company}
                              </div>
                            )}
                          </TableCell>
                          <TableCell>
                            {contact.position && (
                              <div className="flex items-center">
                                <User className="h-4 w-4 mr-2 text-gray-400" />
                                {contact.position}
                              </div>
                            )}
                          </TableCell>
                          <TableCell>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="sm">
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => handleEditContact(contact)}>
                                  Edit
                                </DropdownMenuItem>
                                <DropdownMenuItem 
                                  onClick={() => handleDeleteContact(contact)}
                                  className="text-red-600"
                                >
                                  Delete
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <div className="bg-white px-4 py-20 text-center">
                    {searchQuery ? (
                      <p>No contacts found matching "{searchQuery}"</p>
                    ) : (
                      <div className="flex flex-col items-center">
                        <UserPlus className="h-12 w-12 text-gray-300 mb-4" />
                        <p className="text-gray-500 mb-4">No contacts yet</p>
                        <Button 
                          onClick={() => {
                            setSelectedContact(null);
                            setIsFormOpen(true);
                          }}
                        >
                          <Plus className="mr-2 h-4 w-4" />
                          Add Your First Contact
                        </Button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Contact Form Dialog */}
      <ContactForm
        contact={selectedContact}
        isOpen={isFormOpen}
        onOpenChange={setIsFormOpen}
      />
    </MainLayout>
  );
};

export default ContactsPage;
