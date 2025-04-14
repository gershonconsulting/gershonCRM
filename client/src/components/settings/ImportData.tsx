import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  Tabs, 
  TabsContent, 
  TabsList, 
  TabsTrigger 
} from '@/components/ui/tabs';
import { Loader2, Upload, FileText, Check, AlertCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useMutation } from '@tanstack/react-query';
import { apiRequest, queryClient } from '@/lib/queryClient';

export default function ImportData() {
  const { toast } = useToast();
  const contactsFileRef = useRef<HTMLInputElement>(null);
  const dealsFileRef = useRef<HTMLInputElement>(null);
  const [contactsFile, setContactsFile] = useState<File | null>(null);
  const [dealsFile, setDealsFile] = useState<File | null>(null);

  // Import contacts mutation
  const importContactsMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append('file', file);
      const response = await apiRequest('POST', '/api/import/contacts', formData, false);
      return await response.json();
    },
    onSuccess: (data) => {
      toast({
        title: 'Contacts imported successfully',
        description: `Imported ${data.count} contacts`,
        variant: 'default',
      });
      queryClient.invalidateQueries({ queryKey: ['/api/contacts'] });
      setContactsFile(null);
      if (contactsFileRef.current) {
        contactsFileRef.current.value = '';
      }
    },
    onError: (error: Error) => {
      toast({
        title: 'Import failed',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // Import deals mutation
  const importDealsMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append('file', file);
      const response = await apiRequest('POST', '/api/import/deals', formData, false);
      return await response.json();
    },
    onSuccess: (data) => {
      toast({
        title: 'Deals imported successfully',
        description: `Imported ${data.count} deals`,
        variant: 'default',
      });
      queryClient.invalidateQueries({ queryKey: ['/api/deals'] });
      setDealsFile(null);
      if (dealsFileRef.current) {
        dealsFileRef.current.value = '';
      }
    },
    onError: (error: Error) => {
      toast({
        title: 'Import failed',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const handleContactsFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setContactsFile(e.target.files[0]);
    }
  };

  const handleDealsFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setDealsFile(e.target.files[0]);
    }
  };

  const handleImportContacts = () => {
    if (!contactsFile) {
      toast({
        title: 'No file selected',
        description: 'Please select a CSV file to import',
        variant: 'destructive',
      });
      return;
    }
    importContactsMutation.mutate(contactsFile);
  };

  const handleImportDeals = () => {
    if (!dealsFile) {
      toast({
        title: 'No file selected',
        description: 'Please select a CSV file to import',
        variant: 'destructive',
      });
      return;
    }
    importDealsMutation.mutate(dealsFile);
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="text-2xl">Data Import</CardTitle>
        <CardDescription>
          Import your data from CSV files exported from Streak
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="contacts">
          <TabsList className="mb-6">
            <TabsTrigger value="contacts">Import Contacts</TabsTrigger>
            <TabsTrigger value="deals">Import Deals</TabsTrigger>
          </TabsList>

          <TabsContent value="contacts">
            <div className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="contactsFile">Contacts CSV file</Label>
                <div className="flex gap-4 items-end">
                  <div className="flex-1">
                    <Input 
                      ref={contactsFileRef}
                      id="contactsFile" 
                      type="file" 
                      accept=".csv" 
                      onChange={handleContactsFile} 
                      disabled={importContactsMutation.isPending}
                    />
                  </div>
                  <Button 
                    onClick={handleImportContacts} 
                    disabled={!contactsFile || importContactsMutation.isPending}
                  >
                    {importContactsMutation.isPending ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Importing...
                      </>
                    ) : (
                      <>
                        <Upload className="mr-2 h-4 w-4" />
                        Import Contacts
                      </>
                    )}
                  </Button>
                </div>
                {contactsFile && (
                  <div className="flex items-center text-sm text-muted-foreground">
                    <FileText className="mr-2 h-4 w-4" />
                    {contactsFile.name} ({Math.round(contactsFile.size / 1024)} KB)
                  </div>
                )}
              </div>
              
              <div className="rounded-md bg-amber-50 p-4 border border-amber-200">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <AlertCircle className="h-5 w-5 text-amber-400" />
                  </div>
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-amber-800">Import Instructions</h3>
                    <div className="mt-2 text-sm text-amber-700">
                      <ul className="list-disc space-y-1 pl-5">
                        <li>Use the Contacts CSV file from your Streak export</li>
                        <li>Make sure your CSV includes Name, Email, Phone, Company, and other contact fields</li>
                        <li>Recommended to import contacts before deals</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="deals">
            <div className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="dealsFile">Deals (Boxes) CSV file</Label>
                <div className="flex gap-4 items-end">
                  <div className="flex-1">
                    <Input 
                      ref={dealsFileRef}
                      id="dealsFile" 
                      type="file" 
                      accept=".csv" 
                      onChange={handleDealsFile} 
                      disabled={importDealsMutation.isPending}
                    />
                  </div>
                  <Button 
                    onClick={handleImportDeals} 
                    disabled={!dealsFile || importDealsMutation.isPending}
                  >
                    {importDealsMutation.isPending ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Importing...
                      </>
                    ) : (
                      <>
                        <Upload className="mr-2 h-4 w-4" />
                        Import Deals
                      </>
                    )}
                  </Button>
                </div>
                {dealsFile && (
                  <div className="flex items-center text-sm text-muted-foreground">
                    <FileText className="mr-2 h-4 w-4" />
                    {dealsFile.name} ({Math.round(dealsFile.size / 1024)} KB)
                  </div>
                )}
              </div>
              
              <div className="rounded-md bg-amber-50 p-4 border border-amber-200">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <AlertCircle className="h-5 w-5 text-amber-400" />
                  </div>
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-amber-800">Import Instructions</h3>
                    <div className="mt-2 text-sm text-amber-700">
                      <ul className="list-disc space-y-1 pl-5">
                        <li>Use the Boxes CSV file from your Streak export</li>
                        <li>Make sure your CSV includes Box Name, Stage, Value, and other deal fields</li>
                        <li>Import contacts first to ensure deals are connected to contacts</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}