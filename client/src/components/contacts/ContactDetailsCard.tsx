import React, { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { Contact } from '@shared/schema';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { 
  Mail, 
  Phone, 
  MapPin, 
  Building, 
  User, 
  Twitter, 
  Linkedin, 
  Facebook, 
  Instagram, 
  Globe, 
  PenSquare, 
  Save, 
  X 
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface ContactDetailsCardProps {
  contact: Contact;
  showAvatar?: boolean;
  compact?: boolean;
  onContactUpdated?: () => void;
}

const ContactDetailsCard: React.FC<ContactDetailsCardProps> = ({
  contact,
  showAvatar = true,
  compact = false,
  onContactUpdated
}) => {
  const queryClient = useQueryClient();
  const [isEditing, setIsEditing] = useState(false);
  const [editedContact, setEditedContact] = useState<Partial<Contact>>({...contact});

  // Get first letter of name for avatar
  const getInitials = (name: string) => {
    return name.charAt(0).toUpperCase();
  };

  const handleFieldChange = (field: keyof Contact, value: string) => {
    setEditedContact(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSave = async () => {
    try {
      await apiRequest('PUT', `/api/contacts/${contact.id}`, editedContact);
      queryClient.invalidateQueries({ queryKey: ['/api/contacts'] });
      queryClient.invalidateQueries({ queryKey: ['/api/deals'] });
      setIsEditing(false);
      if (onContactUpdated) onContactUpdated();
    } catch (error) {
      console.error('Failed to update contact:', error);
    }
  };

  const handleCancel = () => {
    setEditedContact({...contact});
    setIsEditing(false);
  };

  const renderEditableField = (
    label: string, 
    field: keyof Contact, 
    icon: React.ReactNode,
    isLink: boolean = false
  ) => {
    const value = editedContact[field] as string || '';
    
    return (
      <div className="flex items-center gap-2">
        <div className="text-gray-400 w-4">
          {icon}
        </div>
        
        {isEditing ? (
          <div className="flex-1">
            <label className="text-xs text-gray-500 block">{label}</label>
            <Input
              value={value}
              onChange={(e) => handleFieldChange(field, e.target.value)}
              className="h-7 text-sm mt-1"
              placeholder={`Enter ${label.toLowerCase()}`}
            />
          </div>
        ) : (
          <div className="flex-1">
            <p className="text-xs text-gray-500">{label}</p>
            {value ? (
              isLink ? (
                <a
                  href={value.startsWith('http') ? value : `https://${value}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-blue-600 hover:underline"
                >
                  {value}
                </a>
              ) : (
                <p className="text-sm">{value}</p>
              )
            ) : (
              <p className="text-sm text-gray-400">—</p>
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="border rounded-md p-4">
      <div className="flex justify-between items-start mb-4">
        {showAvatar && (
          <div className="flex items-center gap-3">
            <Avatar className="h-12 w-12">
              <AvatarFallback>{getInitials(contact.name)}</AvatarFallback>
            </Avatar>
            
            <div>
              {isEditing ? (
                <>
                  <div className="mb-2">
                    <label className="text-xs text-gray-500">Name</label>
                    <Input
                      value={editedContact.name || ''}
                      onChange={(e) => handleFieldChange('name', e.target.value)}
                      className="h-7 text-sm mt-1"
                      placeholder="Enter name"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-gray-500">Title</label>
                    <Input
                      value={editedContact.position || ''}
                      onChange={(e) => handleFieldChange('position', e.target.value)}
                      className="h-7 text-sm mt-1"
                      placeholder="Enter title"
                    />
                  </div>
                </>
              ) : (
                <>
                  <p className="font-medium">{contact.name}</p>
                  <p className="text-sm text-gray-500">{contact.position || ''}</p>
                  <p className="text-sm text-gray-500">{contact.company || ''}</p>
                </>
              )}
            </div>
          </div>
        )}
        
        <div className="flex gap-1">
          {isEditing ? (
            <>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={handleSave}
                className="h-8 w-8 p-0"
              >
                <Save className="h-4 w-4 text-green-600" />
              </Button>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={handleCancel}
                className="h-8 w-8 p-0"
              >
                <X className="h-4 w-4 text-red-600" />
              </Button>
            </>
          ) : (
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => setIsEditing(true)}
              className="h-8 w-8 p-0"
            >
              <PenSquare className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>

      <div className="space-y-3 mt-4">
        {!compact && renderEditableField('First Name', 'firstName', <User className="h-4 w-4" />)}
        {!compact && renderEditableField('Last Name', 'lastName', <User className="h-4 w-4" />)}
        {!compact && renderEditableField('Company', 'company', <Building className="h-4 w-4" />)}
        {!compact && renderEditableField('Role', 'position', <User className="h-4 w-4" />)}
        {renderEditableField('Email', 'email', <Mail className="h-4 w-4" />)}
        {renderEditableField('Phone', 'phone', <Phone className="h-4 w-4" />)}
        {renderEditableField('Location', 'location', <MapPin className="h-4 w-4" />)}
        {renderEditableField('LinkedIn', 'linkedIn', <Linkedin className="h-4 w-4" />, true)}
        {!compact && renderEditableField('Twitter', 'twitter', <Twitter className="h-4 w-4" />, true)}
        {!compact && renderEditableField('Facebook', 'facebook', <Facebook className="h-4 w-4" />, true)}
        {!compact && renderEditableField('Instagram', 'instagram', <Instagram className="h-4 w-4" />, true)}
        {!compact && renderEditableField('Website', 'website', <Globe className="h-4 w-4" />, true)}
      </div>
    </div>
  );
};

export default ContactDetailsCard;