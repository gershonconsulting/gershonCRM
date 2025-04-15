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
import { Loader2, Upload, FileText, AlertCircle, FileCheck } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useMutation } from '@tanstack/react-query';
import { apiRequest, queryClient } from '@/lib/queryClient';

export default function ImportData() {
  const { toast } = useToast();
  const contactsFileRef = useRef<HTMLInputElement>(null);
  const dealsFileRef = useRef<HTMLInputElement>(null);
  const combinedContactsFileRef = useRef<HTMLInputElement>(null);
  const combinedDealsFileRef = useRef<HTMLInputElement>(null);
  
  const [contactsFile, setContactsFile] = useState<File | null>(null);
  const [dealsFile, setDealsFile] = useState<File | null>(null);
  const [combinedContactsFile, setCombinedContactsFile] = useState<File | null>(null);
  const [combinedDealsFile, setCombinedDealsFile] = useState<File | null>(null);

  // Combined import mutation
  const importCombinedMutation = useMutation({
    mutationFn: async () => {
      if (!combinedContactsFile || !combinedDealsFile) {
        throw new Error("Both contacts and deals files are required");
      }
      
      const formData = new FormData();
      formData.append('contactsFile', combinedContactsFile);
      formData.append('dealsFile', combinedDealsFile);
      
      try {
        const response = await apiRequest('POST', '/api/import/combined', formData, false);
        const result = await response.json();
        return result;
      } catch (error) {
        console.error('Combined import error:', error);
        throw error;
      }
    },
    onSuccess: (data) => {
      // Reset file inputs
      if (combinedContactsFileRef.current) combinedContactsFileRef.current.value = '';
      if (combinedDealsFileRef.current) combinedDealsFileRef.current.value = '';
      setCombinedContactsFile(null);
      setCombinedDealsFile(null);
      
      // Invalidate queries to refresh data
      queryClient.invalidateQueries({ queryKey: ['/api/contacts'] });
      queryClient.invalidateQueries({ queryKey: ['/api/deals'] });
      
      toast({
        title: 'Data imported successfully',
        description: `Imported ${data.contacts} contacts and ${data.deals} deals`,
        variant: 'default',
      });
      
      // Invalidate all relevant queries
      queryClient.invalidateQueries({ queryKey: ['/api/contacts'] });
      queryClient.invalidateQueries({ queryKey: ['/api/deals'] });
      queryClient.invalidateQueries({ queryKey: ['/api/deal-stages'] });
      
      // Reset the form
      setCombinedContactsFile(null);
      setCombinedDealsFile(null);
      if (combinedContactsFileRef.current) {
        combinedContactsFileRef.current.value = '';
      }
      if (combinedDealsFileRef.current) {
        combinedDealsFileRef.current.value = '';
      }
    },
    onError: (error: Error) => {
      console.error('Import error:', error);
      toast({
        title: 'Import failed',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // Import contacts mutation
  const importContactsMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append('file', file);
      try {
        const response = await apiRequest('POST', '/api/import/contacts', formData, false);
        const result = await response.json();
        return result;
      } catch (error) {
        console.error('Contacts import error:', error);
        throw error;
      }
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
      try {
        const response = await apiRequest('POST', '/api/import/deals', formData, false);
        const result = await response.json();
        return result;
      } catch (error) {
        console.error('Deals import error:', error);
        throw error;
      }
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
  
  const handleCombinedContactsFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setCombinedContactsFile(e.target.files[0]);
    }
  };

  const handleCombinedDealsFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setCombinedDealsFile(e.target.files[0]);
    }
  };
  
  const handleCombinedImport = () => {
    if (!combinedContactsFile) {
      toast({
        title: 'Missing contacts file',
        description: 'Please select the Contacts CSV file',
        variant: 'destructive',
      });
      return;
    }
    
    if (!combinedDealsFile) {
      toast({
        title: 'Missing deals file',
        description: 'Please select the Boxes CSV file',
        variant: 'destructive',
      });
      return;
    }
    
    importCombinedMutation.mutate();
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

  // New mutation for loading initial data
  const loadInitialDataMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest('POST', '/api/load-initial-data');
      return await response.json();
    },
    onSuccess: (data) => {
      toast({
        title: 'Initial data loaded successfully',
        description: `Loaded ${data.stats.stages} stages, ${data.stats.contacts} contacts, and ${data.stats.deals} deals`,
        variant: 'default',
      });
      
      // Invalidate all relevant queries
      queryClient.invalidateQueries({ queryKey: ['/api/contacts'] });
      queryClient.invalidateQueries({ queryKey: ['/api/deals'] });
      queryClient.invalidateQueries({ queryKey: ['/api/deal-stages'] });
      queryClient.invalidateQueries({ queryKey: ['/api/dashboard/stats'] });
    },
    onError: (error: Error) => {
      toast({
        title: 'Data loading failed',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const handleLoadInitialData = () => {
    if (confirm('This will load data from the attached CSV files directly from the server. Continue?')) {
      loadInitialDataMutation.mutate();
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="text-2xl">Data Import</CardTitle>
        <CardDescription>
          Import your CRM data from CSV files
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-md">
          <div className="flex items-start">
            <FileCheck className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
            <div className="ml-3">
              <h3 className="text-sm font-medium text-green-800">Quick Data Load</h3>
              <p className="text-sm text-green-700 mt-1">
                Use this button to load all the data directly from the CSV files already present on the server.
              </p>
              <Button 
                onClick={handleLoadInitialData} 
                className="mt-3 bg-green-600 hover:bg-green-700"
                disabled={loadInitialDataMutation.isPending}
              >
                {loadInitialDataMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Loading initial data...
                  </>
                ) : (
                  <>
                    <Upload className="mr-2 h-4 w-4" />
                    Load Initial Data
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
        
        <Tabs defaultValue="combined">
          <TabsList className="mb-6">
            <TabsTrigger value="combined">Combined Import</TabsTrigger>
            <TabsTrigger value="contacts">Import Contacts</TabsTrigger>
            <TabsTrigger value="deals">Import Deals</TabsTrigger>
          </TabsList>

          <TabsContent value="combined">
            <div className="space-y-6">
              <div className="p-4 mb-2 border border-green-200 bg-green-50 rounded-md">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <FileCheck className="h-5 w-5 text-green-500" />
                  </div>
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-green-800">Recommended Import Method</h3>
                    <p className="text-sm text-green-700 mt-1">
                      The combined import ensures proper linking between contacts and deals by processing both files together.
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="combinedContactsFile">Contacts CSV File</Label>
                  <Input 
                    ref={combinedContactsFileRef}
                    id="combinedContactsFile" 
                    type="file" 
                    accept=".csv" 
                    onChange={handleCombinedContactsFile} 
                    disabled={importCombinedMutation.isPending}
                  />
                  {combinedContactsFile && (
                    <div className="flex items-center text-sm text-muted-foreground">
                      <FileText className="mr-2 h-4 w-4" />
                      {combinedContactsFile.name} ({Math.round(combinedContactsFile.size / 1024)} KB)
                    </div>
                  )}
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="combinedDealsFile">Boxes/Deals CSV File</Label>
                  <Input 
                    ref={combinedDealsFileRef}
                    id="combinedDealsFile" 
                    type="file" 
                    accept=".csv" 
                    onChange={handleCombinedDealsFile} 
                    disabled={importCombinedMutation.isPending}
                  />
                  {combinedDealsFile && (
                    <div className="flex items-center text-sm text-muted-foreground">
                      <FileText className="mr-2 h-4 w-4" />
                      {combinedDealsFile.name} ({Math.round(combinedDealsFile.size / 1024)} KB)
                    </div>
                  )}
                </div>
              </div>
              
              <Button 
                onClick={handleCombinedImport} 
                disabled={!combinedContactsFile || !combinedDealsFile || importCombinedMutation.isPending}
                className="w-full"
              >
                {importCombinedMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Importing...
                  </>
                ) : (
                  <>
                    <Upload className="mr-2 h-4 w-4" />
                    Import Both Files
                  </>
                )}
              </Button>
              
              <div className="rounded-md bg-amber-50 p-4 border border-amber-200">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <AlertCircle className="h-5 w-5 text-amber-400" />
                  </div>
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-amber-800">Combined Import Instructions</h3>
                    <div className="mt-2 text-sm text-amber-700">
                      <ul className="list-disc space-y-1 pl-5">
                        <li>Select <strong>both</strong> the Contacts CSV and Boxes/Deals CSV files</li>
                        <li>The Box Key field must be present in both files to establish the relationship</li>
                        <li>Combined import ensures proper linking between contacts and deals</li>
                        <li>The system will first import contacts and then connect deals to those contacts</li>
                        <li>Any deals without a matching contact will be skipped</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>
          
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
                        <li><strong>Important:</strong> Import contacts <strong>BEFORE</strong> deals</li>
                        <li>Use the "Contacts" CSV file from your export</li>
                        <li>Make sure your CSV includes First Name, Last Name, Email Addresses, and Box Key</li>
                        <li>The Box Key field is critical as it links contacts with deals</li>
                        <li>Each contact should have a unique Box Key value</li>
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
                <Label htmlFor="dealsFile">Deals CSV file</Label>
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
                        <li><strong>Important:</strong> Import contacts <strong>BEFORE</strong> deals</li>
                        <li>Use the "Boxes" CSV file from your export</li>
                        <li>Make sure your CSV includes Name, Stage, Box Key, and other deal fields</li>
                        <li>The Box Key field must match the Box Key in your contacts CSV</li>
                        <li>Deals without a matching contact Box Key will not import correctly</li>
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