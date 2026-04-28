import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useForm, type UseFormRegisterReturn } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { ArrowLeft, Eye, EyeOff, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from "@/components/ui/form";
import { authService } from "@/services/auth";
import { getApiErrorMessage } from "@/services/api";
import { toast } from "sonner";

const registerSchema = z
  .object({
    firstName: z.string().min(2, "First name is required"),
    lastName: z.string().min(2, "Last name is required"),
    email: z.string().email("Invalid email address"),
    password: z.string().min(6, "Password must be at least 6 characters"),
    confirmPassword: z.string().min(6, "Confirm your password"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  });

type RegisterForm = z.infer<typeof registerSchema>;

export default function RegisterPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [submittedEmail, setSubmittedEmail] = useState<string | null>(null);
  const navigate = useNavigate();

  const form = useForm<RegisterForm>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      password: "",
      confirmPassword: "",
    },
  });

  const onSubmit = async (data: RegisterForm) => {
    setIsLoading(true);

    try {
      const response = await authService.register({
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email,
        password: data.password,
      });

      setSubmittedEmail(response.user.email);
      form.reset();
      toast.success(response.message || "Registration submitted for approval");
    } catch (error) {
      toast.error(
        getApiErrorMessage(error, "Registration failed. Please review your details."),
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#EAF8FB] px-5 py-8">
      <div className="mx-auto max-w-6xl rounded-[32px] bg-white p-6 shadow-xl md:p-10">
        <button
          type="button"
          onClick={() => navigate("/")}
          className="mb-8 inline-flex items-center gap-2 text-sm font-semibold text-slate-700 hover:text-[#049FA7]"
        >
          <ArrowLeft size={18} />
          Back
        </button>

        <div className="grid items-center gap-10 lg:grid-cols-2">
          <div className="mx-auto w-full max-w-md">
            <h1 className="text-center text-4xl font-extrabold text-slate-950">
              Create account
            </h1>
            <p className="mt-3 text-center text-sm text-slate-600">
              Public registration creates a pending employee account.
            </p>

            {submittedEmail ? (
              <div className="mt-8 rounded-3xl border border-[#049FA7]/20 bg-[#EAF8FB] p-6 text-center">
                <h2 className="text-xl font-extrabold text-slate-950">
                  Registration pending approval
                </h2>
                <p className="mt-3 text-sm leading-6 text-slate-600">
                  We created a pending employee profile for {submittedEmail}.
                  An admin or HR manager needs to approve it before sign-in.
                </p>
                <Button
                  asChild
                  className="mt-6 h-11 rounded-full bg-black px-6 text-white hover:bg-[#049FA7]"
                >
                  <Link to="/signin">Back to sign in</Link>
                </Button>
              </div>
            ) : (
              <Form {...form}>
                <form
                  onSubmit={form.handleSubmit(onSubmit)}
                  className="mt-8 space-y-4"
                >
                  <div className="grid gap-4 sm:grid-cols-2">
                    <FormField
                      control={form.control}
                      name="firstName"
                      render={({ field }) => (
                        <FormItem>
                          <FormControl>
                            <Input
                              placeholder="First name"
                              disabled={isLoading}
                              className="h-12 rounded-full border border-slate-900 px-6"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="lastName"
                      render={({ field }) => (
                        <FormItem>
                          <FormControl>
                            <Input
                              placeholder="Last name"
                              disabled={isLoading}
                              className="h-12 rounded-full border border-slate-900 px-6"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormControl>
                          <Input
                            type="email"
                            placeholder="Email"
                            disabled={isLoading}
                            className="h-12 rounded-full border border-slate-900 px-6"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <PasswordField
                    label="Password"
                    visible={showPassword}
                    onToggle={() => setShowPassword((current) => !current)}
                    field={form.register("password")}
                    disabled={isLoading}
                  />
                  <p className="text-sm font-medium text-red-500">
                    {form.formState.errors.password?.message}
                  </p>

                  <PasswordField
                    label="Confirm password"
                    visible={showConfirmPassword}
                    onToggle={() => setShowConfirmPassword((current) => !current)}
                    field={form.register("confirmPassword")}
                    disabled={isLoading}
                  />
                  <p className="text-sm font-medium text-red-500">
                    {form.formState.errors.confirmPassword?.message}
                  </p>

                  <Button
                    type="submit"
                    disabled={isLoading}
                    className="h-12 w-full rounded-full bg-black text-white hover:bg-[#049FA7]"
                  >
                    {isLoading ? (
                      <>
                        <LoadingSpinner label="Submitting registration" />
                        Submitting...
                      </>
                    ) : (
                      "Request account"
                    )}
                  </Button>
                </form>
              </Form>
            )}

            <p className="mt-6 text-center text-sm text-slate-800">
              Already have an account?{" "}
              <Link to="/signin" className="font-semibold text-[#049FA7]">
                Sign in
              </Link>
            </p>
          </div>

          <div className="relative hidden min-h-[560px] overflow-hidden rounded-[32px] bg-[#F3FAF6] p-10 lg:grid lg:place-items-center">
            <div className="absolute left-10 top-10 size-12 rounded-xl bg-[#F8F4D9]" />
            <div className="absolute right-16 top-16 size-8 rounded-lg bg-[#EAF8FB]" />
            <div className="relative z-10 max-w-sm text-center">
              <div className="mx-auto grid size-24 place-items-center rounded-3xl bg-white text-[#049FA7] shadow-sm">
                <UserPlus size={46} />
              </div>
              <h2 className="mt-8 text-2xl font-extrabold leading-tight text-[#0E5961]">
                Join HQ HR Management
              </h2>
              <p className="mt-3 text-sm leading-6 text-slate-600">
                Request an employee account. HR will approve access before the
                dashboard is available.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

interface PasswordFieldProps {
  label: string
  visible: boolean
  onToggle: () => void
  field: UseFormRegisterReturn
  disabled?: boolean
}

function PasswordField({
  label,
  visible,
  onToggle,
  field,
  disabled,
}: PasswordFieldProps) {
  return (
    <div className="relative">
      <Input
        type={visible ? "text" : "password"}
        placeholder={label}
        disabled={disabled}
        className="h-12 rounded-full border border-slate-900 px-6 pr-12"
        {...field}
      />
      <button
        type="button"
        onClick={onToggle}
        disabled={disabled}
        className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-[#049FA7]"
      >
        {visible ? <Eye size={18} /> : <EyeOff size={18} />}
      </button>
    </div>
  );
}
