import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Phone, HelpCircle, MessageSquare } from 'lucide-react';

export default function HelpLinksCard({ onContact, onFAQ, onFeedback }) {
  return (
    <Card className="bg-white border-gray-200">
      <CardHeader>
        <CardTitle>Need Help?</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        <Button variant="link" className="justify-start px-0" onClick={onContact}>
          <Phone className="mr-2" size={18} /> Contact Support
        </Button>
      </CardContent>
    </Card>
  );
}
