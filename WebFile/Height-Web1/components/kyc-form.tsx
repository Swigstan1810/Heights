// components/kyc-form.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { motion } from "framer-motion";
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import type { Database } from "@/types/supabase";
import { useAuth } from "@/contexts/auth-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { 
  User, 
  CreditCard, 
  Building2, 
  FileText, 
  CheckCircle2, 
  AlertCircle,
  Calendar,
  Phone,
  MapPin,
  Banknote,
  Shield
} from "lucide-react";

// KYC Form Schema
const kycSchema = z.object({
  // Personal Information
  full_name: z.string().min(3, "Full name must be at least 3 characters"),
  date_of_birth: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date format"),
  mobile_number: z.string().regex(/^[6-9]\d{9}$/, "Invalid Indian mobile number"),
  
  // Identity Documents
  pan_number: z.string().regex(/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/, "Invalid PAN format"),
  aadhaar_number: z.string().regex(/^\d{12}$/, "Aadhaar must be 12 digits"),
  
  // Address
  address_line1: z.string().min(5, "Address is required"),
  address_line2: z.string().optional(),
  city: z.string().min(2, "City is required"),
  state: z.string().min(2, "State is required"),
  pincode: z.string().regex(/^\d{6}$/, "Invalid pincode"),
  
  // Bank Details
  bank_name: z.string().min(3, "Bank name is required"),
  account_number: z.string().min(8, "Invalid account number"),
  ifsc_code: z.string().regex(/^[A-Z]{4}0[A-Z0-9]{6}$/, "Invalid IFSC code"),
  account_type: z.enum(["savings", "current"]),
  
  // Financial Information
  income_bracket: z.enum(["0-5L", "5-10L", "10-25L", "25L+"]),
});

type KYCFormData = z.infer<typeof kycSchema>;

const steps = [
  { id: 1, title: "Personal Info", icon: User },
  { id: 2, title: "Identity", icon: FileText },
  { id: 3, title: "Address", icon: MapPin },
  { id: 4, title: "Bank Details", icon: CreditCard },
  { id: 5, title: "Financial Info", icon: Banknote },
];

export function KYCForm() {
  const [currentStep, setCurrentStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const { user, updateProfile } = useAuth();
  const supabase = createClientComponentClient<Database>();
  
  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    setValue,
  } = useForm<KYCFormData>({
    resolver: zodResolver(kycSchema),
    defaultValues: {
      account_type: "savings",
      income_bracket: "0-5L",
    },
  });
  
  const onSubmit = async (data: KYCFormData) => {
    if (!user) {
      setError("Please log in to complete KYC");
      return;
    }
    
    setSubmitting(true);
    setError(null);
    
    try {
      // Submit KYC details
      const { error: kycError } = await supabase
        .from("kyc_details")
        .insert({
          user_id: user.id,
          ...data,
          status: "pending",
        });
      
      if (kycError) {
        if (kycError.code === "23505") {
          setError("KYC details already submitted");
        } else {
          setError(kycError.message);
        }
        return;
      }
      
      // Update profile
      await updateProfile({
        full_name: data.full_name,
        kyc_completed: true,
      });
      
      // Redirect to dashboard
      router.push("/dashboard");
    } catch (err) {
      setError("Failed to submit KYC details");
    } finally {
      setSubmitting(false);
    }
  };
  
  const nextStep = () => {
    if (currentStep < steps.length) {
      setCurrentStep(currentStep + 1);
    }
  };
  
  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };
  
  const progress = (currentStep / steps.length) * 100;
  
  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Complete Your KYC</h1>
        <p className="text-muted-foreground">
          Verify your identity to start trading on Heights
        </p>
      </div>
      
      {/* Progress Steps */}
      <div className="mb-8">
        <Progress value={progress} className="mb-4" />
        <div className="flex justify-between">
          {steps.map((step) => {
            const Icon = step.icon;
            const isActive = step.id === currentStep;
            const isCompleted = step.id < currentStep;
            
            return (
              <div
                key={step.id}
                className={`flex flex-col items-center cursor-pointer transition-all ${
                  isActive ? "text-primary" : isCompleted ? "text-green-600" : "text-muted-foreground"
                }`}
                onClick={() => setCurrentStep(step.id)}
              >
                <div
                  className={`p-3 rounded-full mb-2 transition-all ${
                    isActive
                      ? "bg-primary text-primary-foreground"
                      : isCompleted
                      ? "bg-green-100 dark:bg-green-900/20"
                      : "bg-muted"
                  }`}
                >
                  {isCompleted ? (
                    <CheckCircle2 className="h-5 w-5" />
                  ) : (
                    <Icon className="h-5 w-5" />
                  )}
                </div>
                <span className="text-xs font-medium">{step.title}</span>
              </div>
            );
          })}
        </div>
      </div>
      
      {error && (
        <Alert variant="destructive" className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      
      <form onSubmit={handleSubmit(onSubmit)}>
        <Card>
          <CardHeader>
            <CardTitle>{steps[currentStep - 1].title}</CardTitle>
            <CardDescription>
              Please provide accurate information as per your documents
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Step 1: Personal Information */}
            {currentStep === 1 && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3 }}
                className="space-y-4"
              >
                <div>
                  <Label htmlFor="full_name">Full Name (as per PAN)</Label>
                  <Input
                    id="full_name"
                    {...register("full_name")}
                    placeholder="John Doe"
                  />
                  {errors.full_name && (
                    <p className="text-sm text-red-500 mt-1">{errors.full_name.message}</p>
                  )}
                </div>
                
                <div>
                  <Label htmlFor="date_of_birth">Date of Birth</Label>
                  <Input
                    id="date_of_birth"
                    type="date"
                    {...register("date_of_birth")}
                  />
                  {errors.date_of_birth && (
                    <p className="text-sm text-red-500 mt-1">{errors.date_of_birth.message}</p>
                  )}
                </div>
                
                <div>
                  <Label htmlFor="mobile_number">Mobile Number</Label>
                  <Input
                    id="mobile_number"
                    {...register("mobile_number")}
                    placeholder="9876543210"
                    maxLength={10}
                  />
                  {errors.mobile_number && (
                    <p className="text-sm text-red-500 mt-1">{errors.mobile_number.message}</p>
                  )}
                </div>
              </motion.div>
            )}
            
            {/* Step 2: Identity Documents */}
            {currentStep === 2 && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3 }}
                className="space-y-4"
              >
                <div>
                  <Label htmlFor="pan_number">PAN Number</Label>
                  <Input
                    id="pan_number"
                    {...register("pan_number")}
                    placeholder="ABCDE1234F"
                    className="uppercase"
                    maxLength={10}
                  />
                  {errors.pan_number && (
                    <p className="text-sm text-red-500 mt-1">{errors.pan_number.message}</p>
                  )}
                </div>
                
                <div>
                  <Label htmlFor="aadhaar_number">Aadhaar Number</Label>
                  <Input
                    id="aadhaar_number"
                    {...register("aadhaar_number")}
                    placeholder="123456789012"
                    maxLength={12}
                  />
                  {errors.aadhaar_number && (
                    <p className="text-sm text-red-500 mt-1">{errors.aadhaar_number.message}</p>
                  )}
                </div>
                
                <Alert>
                  <Shield className="h-4 w-4" />
                  <AlertDescription>
                    Your documents are encrypted and stored securely. We never share your personal information.
                  </AlertDescription>
                </Alert>
              </motion.div>
            )}
            
            {/* Step 3: Address */}
            {currentStep === 3 && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3 }}
                className="space-y-4"
              >
                <div>
                  <Label htmlFor="address_line1">Address Line 1</Label>
                  <Input
                    id="address_line1"
                    {...register("address_line1")}
                    placeholder="123, Street Name"
                  />
                  {errors.address_line1 && (
                    <p className="text-sm text-red-500 mt-1">{errors.address_line1.message}</p>
                  )}
                </div>
                
                <div>
                  <Label htmlFor="address_line2">Address Line 2 (Optional)</Label>
                  <Input
                    id="address_line2"
                    {...register("address_line2")}
                    placeholder="Apartment, Floor, etc."
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="city">City</Label>
                    <Input
                      id="city"
                      {...register("city")}
                      placeholder="Mumbai"
                    />
                    {errors.city && (
                      <p className="text-sm text-red-500 mt-1">{errors.city.message}</p>
                    )}
                  </div>
                  
                  <div>
                    <Label htmlFor="state">State</Label>
                    <Input
                      id="state"
                      {...register("state")}
                      placeholder="Maharashtra"
                    />
                    {errors.state && (
                      <p className="text-sm text-red-500 mt-1">{errors.state.message}</p>
                    )}
                  </div>
                </div>
                
                <div>
                  <Label htmlFor="pincode">Pincode</Label>
                  <Input
                    id="pincode"
                    {...register("pincode")}
                    placeholder="400001"
                    maxLength={6}
                  />
                  {errors.pincode && (
                    <p className="text-sm text-red-500 mt-1">{errors.pincode.message}</p>
                  )}
                </div>
              </motion.div>
            )}
            
            {/* Step 4: Bank Details */}
            {currentStep === 4 && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3 }}
                className="space-y-4"
              >
                <div>
                  <Label htmlFor="bank_name">Bank Name</Label>
                  <Input
                    id="bank_name"
                    {...register("bank_name")}
                    placeholder="State Bank of India"
                  />
                  {errors.bank_name && (
                    <p className="text-sm text-red-500 mt-1">{errors.bank_name.message}</p>
                  )}
                </div>
                
                <div>
                  <Label htmlFor="account_number">Account Number</Label>
                  <Input
                    id="account_number"
                    {...register("account_number")}
                    placeholder="12345678901234"
                  />
                  {errors.account_number && (
                    <p className="text-sm text-red-500 mt-1">{errors.account_number.message}</p>
                  )}
                </div>
                
                <div>
                  <Label htmlFor="ifsc_code">IFSC Code</Label>
                  <Input
                    id="ifsc_code"
                    {...register("ifsc_code")}
                    placeholder="SBIN0001234"
                    className="uppercase"
                    maxLength={11}
                  />
                  {errors.ifsc_code && (
                    <p className="text-sm text-red-500 mt-1">{errors.ifsc_code.message}</p>
                  )}
                </div>
                
                <div>
                  <Label htmlFor="account_type">Account Type</Label>
                  <Select onValueChange={(value) => setValue("account_type", value as "savings" | "current")}>
                    <SelectTrigger id="account_type">
                      <SelectValue placeholder="Select account type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="savings">Savings</SelectItem>
                      <SelectItem value="current">Current</SelectItem>
                    </SelectContent>
                  </Select>
                  {errors.account_type && (
                    <p className="text-sm text-red-500 mt-1">{errors.account_type.message}</p>
                  )}
                </div>
              </motion.div>
            )}
            
            {/* Step 5: Financial Information */}
            {currentStep === 5 && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3 }}
                className="space-y-4"
              >
                <div>
                  <Label htmlFor="income_bracket">Annual Income</Label>
                  <Select onValueChange={(value) => setValue("income_bracket", value as any)}>
                    <SelectTrigger id="income_bracket">
                      <SelectValue placeholder="Select income bracket" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="0-5L">₹0 - ₹5 Lakhs</SelectItem>
                      <SelectItem value="5-10L">₹5 Lakhs - ₹10 Lakhs</SelectItem>
                      <SelectItem value="10-25L">₹10 Lakhs - ₹25 Lakhs</SelectItem>
                      <SelectItem value="25L+">Above ₹25 Lakhs</SelectItem>
                    </SelectContent>
                  </Select>
                  {errors.income_bracket && (
                    <p className="text-sm text-red-500 mt-1">{errors.income_bracket.message}</p>
                  )}
                </div>
                
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    This information helps us comply with regulatory requirements and provide you with appropriate investment options.
                  </AlertDescription>
                </Alert>
              </motion.div>
            )}
          </CardContent>
        </Card>
        
        {/* Navigation Buttons */}
        <div className="flex justify-between mt-6">
          <Button
            type="button"
            variant="outline"
            onClick={prevStep}
            disabled={currentStep === 1}
          >
            Previous
          </Button>
          
          {currentStep < steps.length ? (
            <Button type="button" onClick={nextStep}>
              Next
            </Button>
          ) : (
            <Button type="submit" disabled={submitting}>
              {submitting ? "Submitting..." : "Submit KYC"}
            </Button>
          )}
        </div>
      </form>
    </div>
  );
}