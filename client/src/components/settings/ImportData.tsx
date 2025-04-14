import React, { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { queryClient } from '@/lib/queryClient';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle, CheckCircle2 } from 'lucide-react';
import { Progress } from '@/components/ui/progress';

export default function ImportData() {
  const { toast } = useToast();
  const [boxesFile, setBoxesFile] = useState<File | null>(null);
  const [contactsFile, setContactsFile] = useState<File | null>(null);
  const [importStats, setImportStats] = useState<{
    stages: number;
    contacts: number;
    deals: number;
  } | null>(null);
  const [importError, setImportError] = useState<string | null>(null);
  const [importStatus, setImportStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');

  const handleBoxesFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setBoxesFile(e.target.files[0]);
    }
  };

  const handleContactsFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setContactsFile(e.target.files[0]);
    }
  };

  const importMutation = useMutation({
    mutationFn: async () => {
      if (!boxesFile || !contactsFile) {
        throw new Error('Please select both boxes and contacts CSV files');
      }

      // Read the files
      const boxesData = await boxesFile.text();
      const contactsData = await contactsFile.text();

      // Send to server
      const response = await apiRequest('/api/import/streak-data', {
        method: 'POST',
        body: JSON.stringify({ boxesData, contactsData }),
        headers: { 'Content-Type': 'application/json' }
      });

      return await response.json();
    },
    onMutate: () => {
      setImportStatus('loading');
      setImportError(null);
      setImportStats(null);
    },
    onSuccess: (data) => {
      setImportStatus('success');
      setImportStats(data.stats);
      queryClient.invalidateQueries({ queryKey: ['/api/contacts'] });
      queryClient.invalidateQueries({ queryKey: ['/api/deals'] });
      queryClient.invalidateQueries({ queryKey: ['/api/deal-stages'] });
      toast({
        title: 'Import Successful',
        description: `Imported ${data.stats.deals} deals, ${data.stats.contacts} contacts, and ${data.stats.stages} stages.`,
      });
    },
    onError: (error: Error) => {
      setImportStatus('error');
      setImportError(error.message);
      toast({
        title: 'Import Failed',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const handleImport = () => {
    importMutation.mutate();
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Import Data</CardTitle>
        <CardDescription>
          Import your data from Streak CRM into this application
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="import">
          <TabsList className="grid w-full grid-cols-1">
            <TabsTrigger value="import">Streak Import</TabsTrigger>
          </TabsList>
          <TabsContent value="import" className="space-y-4">
            <div className="space-y-4">
              <div>
                <Label htmlFor="boxes-file">Boxes CSV File</Label>
                <Input
                  id="boxes-file"
                  type="file"
                  accept=".csv"
                  onChange={handleBoxesFileChange}
                  disabled={importStatus === 'loading'}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Upload the Streak Export Boxes CSV file
                </p>
              </div>
              <div>
                <Label htmlFor="contacts-file">Contacts CSV File</Label>
                <Input
                  id="contacts-file"
                  type="file"
                  accept=".csv"
                  onChange={handleContactsFileChange}
                  disabled={importStatus === 'loading'}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Upload the Streak Export Contacts CSV file
                </p>
              </div>

              {importStatus === 'loading' && (
                <div className="py-4">
                  <p className="mb-2">Importing data...</p>
                  <Progress value={50} className="w-full" />
                </div>
              )}

              {importStatus === 'success' && importStats && (
                <Alert variant="default" className="bg-green-50 border-green-200">
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                  <AlertTitle className="text-green-800">Import Successful</AlertTitle>
                  <AlertDescription className="text-green-700">
                    <ul className="list-disc pl-5 space-y-1">
                      <li>Imported {importStats.stages} pipeline stages</li>
                      <li>Imported {importStats.contacts} contacts</li>
                      <li>Imported {importStats.deals} deals</li>
                    </ul>
                  </AlertDescription>
                </Alert>
              )}

              {importStatus === 'error' && importError && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>Import Failed</AlertTitle>
                  <AlertDescription>
                    {importError}
                  </AlertDescription>
                </Alert>
              )}

              <Button 
                onClick={handleImport} 
                disabled={!boxesFile || !contactsFile || importStatus === 'loading'}
                className="w-full"
              >
                {importStatus === 'loading' ? 'Importing...' : 'Import Data'}
              </Button>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}