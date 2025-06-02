"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { motion } from "framer-motion";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/auth-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  AlertCircle, 
  CheckCircle, 
  Calendar, 
  CreditCard,
  Building,
  Home,
  Phone,
  DollarSign,
  User
} from "lucide-react";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

// Define the form schema with Zod for validation
const kycFormSchema = z.object({
  fullName: z.string().min(3, { message: "Full name must be at least 3 characters" }),
  dateOfBirth: z.string().refine((date) => {
    const dob = new Date(date);
    const today = new Date();
    const age = today.getFullYear() - dob.getFullYear();
    const monthDiff = today.getMonth() - dob.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dob.getDate())) {
      return age - 1 >= 18;
    }
    return age >= 18;
  }, { message: "You must be at least 18 years old" }),
  panNumber: z.string()
    .regex(/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/, { message: "Invalid PAN number format (e.g., ABCDE1234F)" }),
  aadhaarNumber: z.string()
    .regex(/^\d{12}$/, { message: "Aadhaar number must be 12 digits" }),
  address: z.string().min(5, { message: "Address must be at least 5 characters" }),
  city: z.string().min(2, { message: "City is required" }),
  state: z.string().min(2, { message: "State is required" }),
  postalCode: z.string()
    .regex(/^\d{6}$/, { message: "Postal code must be 6 digits" }),
  mobileNumber: z.string()
    .regex(/^[6-9]\d{9}$/, { message: "Enter a valid 10-digit Indian mobile number" }),
  bankAccountNumber: z.string()
    .min(9, { message: "Bank account number must be at least 9 digits" })
    .max(18, { message: "Bank account number cannot exceed 18 digits" }),
  bankIfscCode: z.string()
    .regex(/^[A-Z]{4}0[A-Z0-9]{6}$/, { message: "Invalid IFSC code format (e.g., SBIN0123456)" }),
  bankName: z.string().min(3, { message: "Bank name is required" }),
  incomeBracket: z.string().min(1, { message: "Income bracket is required" }),
});

type KycFormValues = z.infer<typeof kycFormSchema>;

export function KycForm() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const router = useRouter();
  const { user } = useAuth();
  
  const form = useForm<KycFormValues>({
    resolver: zodResolver(kycFormSchema),
    defaultValues: {
      fullName: "",
      dateOfBirth: "",
      panNumber: "",
      aadhaarNumber: "",
      address: "",
      city: "",
      state: "",
      postalCode: "",
      mobileNumber: "",
      bankAccountNumber: "",
      bankIfscCode: "",
      bankName: "",
      incomeBracket: "",
    },
  });
  
  const onSubmit = async (data: KycFormValues) => {
    if (!user) {
      setError("You must be logged in to complete KYC");
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      // Insert KYC details into the database
      const { error: kycError } = await supabase
        .from('kyc_details')
        .insert({
          user_id: user.id,
          full_name: data.fullName,
          date_of_birth: data.dateOfBirth,
          pan_number: data.panNumber,
          aadhaar_number: data.aadhaarNumber,
          address: data.address,
          city: data.city,
          state: data.state,
          postal_code: data.postalCode,
          mobile_number: data.mobileNumber,
          bank_account_number: data.bankAccountNumber,
          bank_ifsc_code: data.bankIfscCode,
          bank_name: data.bankName,
          income_bracket: data.incomeBracket,
          status: 'pending', // Add this status field to track verification
        });
      
      if (kycError) {
        throw new Error(kycError.message);
      }
      
      // Mark KYC as submitted but pending verification
      setSuccess("KYC verification submitted successfully! Your information will be reviewed within 1-3 business days.");
      setTimeout(() => {
        router.push('/dashboard');
      }, 3000);
    } catch (err: unknown) {
      setError((err as Error)?.message || "An error occurred while submitting KYC details");
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="w-full max-w-4xl p-6 md:p-8 bg-card rounded-lg border border-border shadow-xl"
    >
      <div className="mb-8 text-center">
        <h2 className="text-2xl md:text-3xl font-bold">KYC Verification</h2>
        <p className="mt-2 text-muted-foreground">
          Complete your KYC details to start trading on Heights
        </p>
      </div>
      
      {error && (
        <Alert variant="destructive" className="mb-6">
          <AlertCircle className="h-4 w-4 mr-2" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      
      {success && (
        <Alert className="mb-6 bg-green-100 border-green-200 dark:bg-green-900/20 dark:border-green-900">
          <CheckCircle className="h-4 w-4 mr-2 text-green-600 dark:text-green-400" />
          <AlertDescription className="text-green-800 dark:text-green-400">{success}</AlertDescription>
        </Alert>
      )}
      
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Personal Information */}
            <div className="space-y-4 md:col-span-2">
              <h3 className="text-lg font-semibold flex items-center">
                <User className="mr-2 h-5 w-5" /> Personal Information
              </h3>
              
              <FormField
                control={form.control}
                name="fullName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Full Name (as per PAN card)</FormLabel>
                    <FormControl>
                      <Input placeholder="John Doe" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="dateOfBirth"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Date of Birth</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Calendar className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                        <Input type="date" className="pl-10" {...field} />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="panNumber"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>PAN Number</FormLabel>
                      <FormControl>
                        <Input placeholder="ABCDE1234F" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="aadhaarNumber"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Aadhaar Number</FormLabel>
                      <FormControl>
                        <Input placeholder="123456789012" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <FormField
                control={form.control}
                name="mobileNumber"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Mobile Number</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Phone className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                        <Input placeholder="9876543210" className="pl-10" {...field} />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            {/* Address Information */}
            <div className="space-y-4 md:col-span-2">
              <h3 className="text-lg font-semibold flex items-center">
                <Home className="mr-2 h-5 w-5" /> Address Information
              </h3>
              
              <FormField
                control={form.control}
                name="address"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Address</FormLabel>
                    <FormControl>
                      <Input placeholder="123 Main Street, Apartment 4B" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <FormField
                  control={form.control}
                  name="city"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>City</FormLabel>
                      <FormControl>
                        <Input placeholder="Mumbai" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="state"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>State</FormLabel>
                      <FormControl>
                        <Input placeholder="Maharashtra" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="postalCode"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Postal Code</FormLabel>
                      <FormControl>
                        <Input placeholder="400001" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>
            
            {/* Bank Information */}
            <div className="space-y-4 md:col-span-2">
              <h3 className="text-lg font-semibold flex items-center">
                <Building className="mr-2 h-5 w-5" /> Bank Information
              </h3>
              
              <FormField
                control={form.control}
                name="bankName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Bank Name</FormLabel>
                    <FormControl>
                      <Input placeholder="State Bank of India" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="bankAccountNumber"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Bank Account Number</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <CreditCard className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                          <Input placeholder="123456789012" className="pl-10" {...field} />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="bankIfscCode"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>IFSC Code</FormLabel>
                      <FormControl>
                        <Input placeholder="SBIN0123456" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>
            
            {/* Financial Information */}
            <div className="space-y-4 md:col-span-2">
              <h3 className="text-lg font-semibold flex items-center">
                <DollarSign className="mr-2 h-5 w-5" /> Financial Information
              </h3>
              
              <FormField
                control={form.control}
                name="incomeBracket"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Annual Income</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select annual income range" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="Below ₹2.5 Lakhs">Below ₹2.5 Lakhs</SelectItem>
                        <SelectItem value="₹2.5 Lakhs - ₹5 Lakhs">₹2.5 Lakhs - ₹5 Lakhs</SelectItem>
                        <SelectItem value="₹5 Lakhs - ₹10 Lakhs">₹5 Lakhs - ₹10 Lakhs</SelectItem>
                        <SelectItem value="₹10 Lakhs - ₹25 Lakhs">₹10 Lakhs - ₹25 Lakhs</SelectItem>
                        <SelectItem value="₹25 Lakhs - ₹50 Lakhs">₹25 Lakhs - ₹50 Lakhs</SelectItem>
                        <SelectItem value="₹50 Lakhs - ₹1 Crore">₹50 Lakhs - ₹1 Crore</SelectItem>
                        <SelectItem value="Above ₹1 Crore">Above ₹1 Crore</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </div>
          
          <div className="border-t pt-6">
            <p className="text-sm text-muted-foreground mb-6">
              By submitting this form, you declare that all the information provided is true and accurate. 
              Heights Trading Platform may verify your information with appropriate authorities.
            </p>
            
            <Button
              type="submit"
              className="w-full"
              disabled={loading}
            >
              {loading ? "Submitting..." : "Submit KYC Details"}
            </Button>
          </div>
        </form>
      </Form>
    </motion.div>
  );
}