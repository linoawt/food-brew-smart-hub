import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { 
  CreditCard, 
  Smartphone, 
  Building2, 
  Banknote,
  CheckCircle,
  AlertCircle,
  Clock
} from 'lucide-react';
import { formatNaira } from '@/lib/utils';

interface PaymentGatewayProps {
  amount: number;
  onPaymentComplete: (paymentMethod: string, reference: string) => void;
  onPaymentCancel: () => void;
  loading?: boolean;
}

type PaymentMethod = 'bank_transfer' | 'ussd' | 'card' | 'mobile_money' | 'cash_on_delivery';

const PaymentGateway = ({ amount, onPaymentComplete, onPaymentCancel, loading = false }: PaymentGatewayProps) => {
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod>('bank_transfer');
  const [paymentStatus, setPaymentStatus] = useState<'idle' | 'processing' | 'success' | 'failed'>('idle');
  const [paymentReference, setPaymentReference] = useState('');

  const paymentMethods = [
    {
      id: 'bank_transfer' as PaymentMethod,
      name: 'Bank Transfer',
      icon: Building2,
      description: 'Transfer to our bank account',
      instructions: 'Transfer to NaijaFeast account and share receipt',
      available: true
    },
    {
      id: 'ussd' as PaymentMethod,
      name: 'USSD Payment',
      icon: Smartphone,
      description: 'Pay with your bank USSD code',
      instructions: 'Use your bank USSD code to complete payment',
      available: true
    },
    {
      id: 'card' as PaymentMethod,
      name: 'Debit/Credit Card',
      icon: CreditCard,
      description: 'Pay with your card (Coming Soon)',
      instructions: 'Card payment integration coming soon',
      available: false
    },
    {
      id: 'mobile_money' as PaymentMethod,
      name: 'Mobile Money',
      icon: Smartphone,
      description: 'Pay with mobile money (Coming Soon)',
      instructions: 'Mobile money payment coming soon',
      available: false
    },
    {
      id: 'cash_on_delivery' as PaymentMethod,
      name: 'Cash on Delivery',
      icon: Banknote,
      description: 'Pay when your order arrives',
      instructions: 'Pay the delivery agent in cash',
      available: true
    }
  ];

  const handlePayment = async () => {
    setPaymentStatus('processing');
    
    // Generate a mock payment reference
    const reference = `NF_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    setPaymentReference(reference);

    // Simulate payment processing
    await new Promise(resolve => setTimeout(resolve, 2000));

    if (selectedMethod === 'cash_on_delivery') {
      setPaymentStatus('success');
      setTimeout(() => {
        onPaymentComplete(selectedMethod, reference);
      }, 1500);
    } else {
      // For manual payments, we'll mark as pending and require manual verification
      setPaymentStatus('success');
      setTimeout(() => {
        onPaymentComplete(selectedMethod, reference);
      }, 1500);
    }
  };

  const renderPaymentInstructions = () => {
    const method = paymentMethods.find(m => m.id === selectedMethod);
    
    if (!method) return null;

    switch (selectedMethod) {
      case 'bank_transfer':
        return (
          <Card className="mt-4">
            <CardHeader>
              <CardTitle className="text-lg">Bank Transfer Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="bg-muted p-4 rounded-lg space-y-2">
                <div className="flex justify-between">
                  <span className="font-medium">Bank Name:</span>
                  <span>First Bank Nigeria</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium">Account Name:</span>
                  <span>NaijaFeast Limited</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium">Account Number:</span>
                  <span className="font-mono">3123456789</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium">Amount:</span>
                  <span className="font-bold text-primary">{formatNaira(amount)}</span>
                </div>
              </div>
              <p className="text-sm text-muted-foreground">
                After transfer, take a screenshot of your receipt. Our team will verify the payment and confirm your order.
              </p>
            </CardContent>
          </Card>
        );

      case 'ussd':
        return (
          <Card className="mt-4">
            <CardHeader>
              <CardTitle className="text-lg">USSD Payment Instructions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-muted p-3 rounded-lg">
                  <h5 className="font-medium mb-1">GTBank</h5>
                  <p className="text-sm font-mono">*737*1*Amount*3123456789#</p>
                </div>
                <div className="bg-muted p-3 rounded-lg">
                  <h5 className="font-medium mb-1">Access Bank</h5>
                  <p className="text-sm font-mono">*901*0*Amount*3123456789#</p>
                </div>
                <div className="bg-muted p-3 rounded-lg">
                  <h5 className="font-medium mb-1">First Bank</h5>
                  <p className="text-sm font-mono">*894*Amount*3123456789#</p>
                </div>
                <div className="bg-muted p-3 rounded-lg">
                  <h5 className="font-medium mb-1">UBA</h5>
                  <p className="text-sm font-mono">*919*4*Amount*3123456789#</p>
                </div>
              </div>
              <p className="text-sm text-muted-foreground">
                Replace "Amount" with {amount}. Save the confirmation SMS as proof of payment.
              </p>
            </CardContent>
          </Card>
        );

      case 'cash_on_delivery':
        return (
          <Card className="mt-4">
            <CardHeader>
              <CardTitle className="text-lg">Cash on Delivery</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-lg">
                <div className="flex items-start">
                  <AlertCircle className="w-5 h-5 text-yellow-600 mr-2 mt-0.5" />
                  <div>
                    <p className="text-sm text-yellow-800">
                      You will pay {formatNaira(amount)} in cash when your order is delivered.
                    </p>
                    <p className="text-xs text-yellow-700 mt-1">
                      Please have the exact amount ready for the delivery agent.
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        );

      default:
        return null;
    }
  };

  if (paymentStatus === 'processing') {
    return (
      <Card>
        <CardContent className="py-12">
          <div className="text-center">
            <Clock className="w-16 h-16 text-primary mx-auto mb-4 animate-spin" />
            <h3 className="text-xl font-semibold mb-2">Processing Payment</h3>
            <p className="text-muted-foreground">Please wait while we process your payment...</p>
            {paymentReference && (
              <p className="text-sm text-muted-foreground mt-2">
                Reference: {paymentReference}
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (paymentStatus === 'success') {
    return (
      <Card>
        <CardContent className="py-12">
          <div className="text-center">
            <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2">Payment Initiated</h3>
            <p className="text-muted-foreground mb-4">
              {selectedMethod === 'cash_on_delivery' 
                ? "Your order has been confirmed for cash on delivery."
                : "We'll verify your payment and confirm your order soon."
              }
            </p>
            <p className="text-sm text-muted-foreground">
              Reference: {paymentReference}
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-xl">Choose Payment Method</CardTitle>
          <p className="text-muted-foreground">
            Select how you'd like to pay {formatNaira(amount)}
          </p>
        </CardHeader>
        <CardContent>
          <RadioGroup 
            value={selectedMethod} 
            onValueChange={(value) => setSelectedMethod(value as PaymentMethod)}
            className="space-y-3"
          >
            {paymentMethods.map((method) => {
              const Icon = method.icon;
              return (
                <div key={method.id} className="flex items-center space-x-3 p-3 rounded-lg border hover:bg-muted/50">
                  <RadioGroupItem 
                    value={method.id} 
                    id={method.id}
                    disabled={!method.available}
                  />
                  <div className="flex items-center space-x-3 flex-1">
                    <Icon className="w-6 h-6 text-primary" />
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <Label 
                          htmlFor={method.id} 
                          className={`font-medium ${!method.available ? 'text-muted-foreground' : ''}`}
                        >
                          {method.name}
                        </Label>
                        {!method.available && (
                          <Badge variant="secondary" className="text-xs">
                            Coming Soon
                          </Badge>
                        )}
                      </div>
                      <p className={`text-sm ${!method.available ? 'text-muted-foreground' : 'text-muted-foreground'}`}>
                        {method.description}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </RadioGroup>
        </CardContent>
      </Card>

      {renderPaymentInstructions()}

      <div className="flex gap-4">
        <Button 
          variant="outline" 
          onClick={onPaymentCancel}
          disabled={loading}
          className="flex-1"
        >
          Cancel
        </Button>
        <Button 
          onClick={handlePayment}
          disabled={loading || !paymentMethods.find(m => m.id === selectedMethod)?.available}
          className="flex-1"
          variant="food"
        >
          {selectedMethod === 'cash_on_delivery' ? 'Confirm Order' : 'Proceed with Payment'}
        </Button>
      </div>
    </div>
  );
};

export default PaymentGateway;