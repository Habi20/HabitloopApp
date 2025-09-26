import { useState } from "react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
// import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";

interface TermsAndPrivacyModalProps {
  open: boolean;
  onClose: () => void;
  onAccept: () => void;
  type: 'signup' | 'signin';
}

export function TermsAndPrivacyModal({ open, onClose, onAccept, type }: TermsAndPrivacyModalProps) {
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [acceptedPrivacy, setAcceptedPrivacy] = useState(false);

  const canProceed = acceptedTerms && acceptedPrivacy;

  const handleAccept = () => {
    if (canProceed) {
      onAccept();
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl max-h-[80vh] mx-4 sm:mx-0 p-6 sm:p-8">
        <DialogHeader>
          <DialogTitle className="text-center text-xl font-bold">
            {type === 'signup' ? 'Terms & Privacy Agreement' : 'Privacy Notice'}
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          <Tabs defaultValue="terms" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="terms">Terms of Service</TabsTrigger>
              <TabsTrigger value="privacy">Privacy Policy</TabsTrigger>
            </TabsList>
            
            <TabsContent value="terms" className="space-y-4">
              <ScrollArea className="h-64 w-full rounded-md border p-4">
                <div className="space-y-4 text-sm">
                  <h3 className="font-semibold text-lg">Terms of Service</h3>
                  
                  <div>
                    <h4 className="font-medium">User Account Creation</h4>
                    <p className="text-gray-600 mt-1">
                      By creating or signing in to a HabitLoop account, users agree to provide basic personal information 
                      (such as name and email address) for account registration and authentication. This information is 
                      stored securely using industry-standard encryption and is never shared or sold to third parties 
                      without explicit consent.
                    </p>
                  </div>

                  <div>
                    <h4 className="font-medium">Service Usage</h4>
                    <p className="text-gray-600 mt-1">
                      HabitLoop is provided as a habit tracking service. Users agree to use the service responsibly 
                      and not to abuse or misuse the platform. We reserve the right to suspend accounts that violate 
                      these terms.
                    </p>
                  </div>

                  <div>
                    <h4 className="font-medium">Data Security</h4>
                    <p className="text-gray-600 mt-1">
                      All data is transmitted over secure protocols (SSL). User data is encrypted and only accessed 
                      for legitimate support or legal queries. The app does not knowingly collect data from or market 
                      to children under 18.
                    </p>
                  </div>

                  <div>
                    <h4 className="font-medium">User Rights</h4>
                    <p className="text-gray-600 mt-1">
                      Users have control over the information they share and can opt-out of non-essential data tracking. 
                      All requests for data removal or correction are honored promptly. Any changes in the policy will 
                      be communicated transparently.
                    </p>
                  </div>
                </div>
              </ScrollArea>
            </TabsContent>
            
            <TabsContent value="privacy" className="space-y-4">
              <ScrollArea className="h-64 w-full rounded-md border p-4">
                <div className="space-y-4 text-sm">
                  <h3 className="font-semibold text-lg">Privacy Policy</h3>
                  
                  <div>
                    <h4 className="font-medium">Data Collection</h4>
                    <p className="text-gray-600 mt-1">
                      Only the minimum data required for authentication and personalized habit tracking is collected. 
                      No plain-text passwords are stored; all credentials are encrypted.
                    </p>
                  </div>

                  <div>
                    <h4 className="font-medium">Data Usage</h4>
                    <p className="text-gray-600 mt-1">
                      Data is never shared for advertising or commercial purposes, only for providing/improving the 
                      habit tracking service. Users can request, update, or delete their account data at any time.
                    </p>
                  </div>

                  <div>
                    <h4 className="font-medium">Data Protection</h4>
                    <p className="text-gray-600 mt-1">
                      All data is transmitted over secure protocols (SSL). User data is encrypted and only accessed 
                      for legitimate support or legal queries. We implement industry-standard security measures to 
                      protect your information.
                    </p>
                  </div>

                  <div>
                    <h4 className="font-medium">Policy Scope</h4>
                    <p className="text-gray-600 mt-1">
                      This policy covers all authentication procedures. Usage of habit tracking features after 
                      authentication is covered under the main application privacy policy.
                    </p>
                  </div>

                  <div>
                    <h4 className="font-medium">Contact</h4>
                    <p className="text-gray-600 mt-1">
                      For any privacy concerns or data requests, please contact us through the app or at 
                      privacy@habitloop.app
                    </p>
                  </div>
                </div>
              </ScrollArea>
            </TabsContent>
          </Tabs>

          {/* Agreement Checkboxes */}
          <div className="space-y-3">
            <div className="flex items-center space-x-2">
              <Checkbox 
                id="terms" 
                checked={acceptedTerms}
                onCheckedChange={(checked) => setAcceptedTerms(checked as boolean)}
              />
              <Label htmlFor="terms" className="text-sm">
                I agree to the Terms of Service
              </Label>
            </div>
            
            <div className="flex items-center space-x-2">
              <Checkbox 
                id="privacy" 
                checked={acceptedPrivacy}
                onCheckedChange={(checked) => setAcceptedPrivacy(checked as boolean)}
              />
              <Label htmlFor="privacy" className="text-sm">
                I agree to the Privacy Policy
              </Label>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3">
            <Button
              variant="outline"
              onClick={onClose}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              onClick={handleAccept}
              disabled={!canProceed}
              className="flex-1"
            >
              {type === 'signup' ? 'Accept & Continue' : 'Accept & Sign In'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
