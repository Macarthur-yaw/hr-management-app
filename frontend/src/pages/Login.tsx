import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { ArrowLeft, Eye, EyeOff, ShieldCheck } from "lucide-react";
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
import { useAuthStore } from "@/hooks/useAuth";
import { authService } from "@/services/auth";
import { getApiErrorMessage } from "@/services/api";
import { toast } from "sonner";

const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

type LoginForm = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();
  const { login } = useAuthStore();

  const form = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const onSubmit = async (data: LoginForm) => {
    setIsLoading(true);

    try {
      const response = await authService.login(data.email, data.password);
      login(response);
      toast.success("Login successful");
      navigate("/dashboard");
    } catch (error) {
      toast.error(
        getApiErrorMessage(error, "Login failed. Please check your credentials."),
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
          Back to home
        </button>

        <div className="grid min-h-[680px] items-center gap-10 lg:grid-cols-2">
          <div className="mx-auto w-full max-w-md">
            <div className="text-center">
              <h1 className="text-4xl font-extrabold text-slate-950">
                Welcome back
              </h1>
              <p className="mt-3 text-sm text-slate-600">
                Sign in to continue managing your HR operations.
              </p>
            </div>

            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(onSubmit)}
                className="mt-10 space-y-5"
              >
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                          <Input
                            type="email"
                            placeholder="Email address"
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
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <div className="relative">
                          <Input
                            type={showPassword ? "text" : "password"}
                            placeholder="Password"
                            disabled={isLoading}
                            className="h-12 rounded-full border border-slate-900 px-6 pr-12"
                            {...field}
                          />
                          <button
                            type="button"
                            onClick={() => setShowPassword((current) => !current)}
                            disabled={isLoading}
                            className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-[#049FA7]"
                          >
                            {showPassword ? <Eye size={18} /> : <EyeOff size={18} />}
                          </button>
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Button
                  type="submit"
                  disabled={isLoading}
                  className="h-12 w-full rounded-full bg-black text-white hover:bg-[#038891]"
                >
                  {isLoading ? (
                    <>
                      <LoadingSpinner label="Signing in" />
                      Signing in...
                    </>
                  ) : (
                    "Login"
                  )}
                </Button>
              </form>
            </Form>

            <p className="mt-12 text-center text-sm text-slate-800">
              Not a member?{" "}
              <Link to="/register" className="font-semibold text-[#049FA7]">
                Register now
              </Link>
            </p>
          </div>

          <div className="relative hidden min-h-[560px] overflow-hidden rounded-[32px] bg-[#F3FAF6] p-10 lg:grid lg:place-items-center">
            <div className="absolute left-10 top-10 size-12 rounded-xl bg-[#F8F4D9]" />
            <div className="absolute right-16 top-16 size-8 rounded-lg bg-[#EAF8FB]" />
            <div className="relative z-10 max-w-sm text-center">
              <div className="mx-auto grid size-24 place-items-center rounded-3xl bg-white text-[#049FA7] shadow-sm">
                <ShieldCheck size={46} />
              </div>
              <h2 className="mt-8 text-2xl font-extrabold leading-tight text-[#0E5961]">
                Secure access to HQ HR Management
              </h2>
              <p className="mt-3 text-sm leading-6 text-slate-600">
                Continue managing employees, departments, and leave requests
                from one connected dashboard.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
