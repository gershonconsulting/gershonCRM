import React from 'react';
import MainLayout from '@/layouts/MainLayout';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Star } from 'lucide-react';

export default function ByInterest() {
  return (
    <MainLayout>
      <div className="container mx-auto py-6">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold">Contacts by Interest</h1>
          <Button>Add Contact</Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-xl flex items-center">
                <Star className="h-5 w-5 mr-2 text-yellow-500" />
                High Interest
              </CardTitle>
              <CardDescription>Contacts showing high interest</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">0</p>
              <p className="text-sm text-gray-500">contacts</p>
            </CardContent>
            <CardFooter>
              <Button variant="outline" size="sm" className="w-full">View Contacts</Button>
            </CardFooter>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-xl flex items-center">
                <Star className="h-5 w-5 mr-2 text-amber-500" />
                Medium Interest
              </CardTitle>
              <CardDescription>Contacts showing moderate interest</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">0</p>
              <p className="text-sm text-gray-500">contacts</p>
            </CardContent>
            <CardFooter>
              <Button variant="outline" size="sm" className="w-full">View Contacts</Button>
            </CardFooter>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-xl flex items-center">
                <Star className="h-5 w-5 mr-2 text-gray-500" />
                Low Interest
              </CardTitle>
              <CardDescription>Contacts showing little interest</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">0</p>
              <p className="text-sm text-gray-500">contacts</p>
            </CardContent>
            <CardFooter>
              <Button variant="outline" size="sm" className="w-full">View Contacts</Button>
            </CardFooter>
          </Card>
        </div>

        <div className="mt-8">
          <h2 className="text-2xl font-bold mb-4">All Contacts</h2>
          <div className="bg-white rounded-lg shadow">
            <div className="p-4 border-b">
              <p className="text-gray-500">No contacts found</p>
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}