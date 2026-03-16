"use client"

import { authClient } from "@/lib/auth-client"
import { useRouter } from "next/navigation"
import { useEffect } from "react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"

export function LoginForm({
  className,
  ...props
}: React.ComponentProps<"div">) {
  const router = useRouter()

  // pull the React hook from better-auth
  const { useSession } = authClient
  const { data: session } = useSession()

  // If already logged in, send user to dashboard
  useEffect(() => {
    if (session?.user) {
      router.push("/dashboard/profit-analysis") // or "/profit-analysis" if you prefer
    }
  }, [session, router])

  // Google OAuth handler
  const handleGoogleLogin = async () => {
    await authClient.signIn.social({
      provider: "google",
      callbackURL: "/dashboard/profit-analysis", // change to "/profit-analysis" if that's your default
    })
  }

  // For now, prevent the email/password form from doing anything
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    // You can either remove this form entirely or later hook it up
    // to password-based auth if you ever add it.
  }
  return (
    <div className={cn("flex flex-col gap-6" , className)} {...props}>
      <Card>
        <CardHeader>
          <CardTitle>Login to your TeamBlueLock account</CardTitle>
          {/* <CardDescription>
            Enter your email below to login to your account
          </CardDescription> */}
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit}>
            <FieldGroup>
              {/* <Field>
                <FieldLabel htmlFor="email">Email</FieldLabel>
                <Input
                  id="email"
                  type="email"
                  placeholder="m@example.com"
                  required
                />
              </Field>
              <Field>
                <div className="flex items-center">
                  <FieldLabel htmlFor="password">Password</FieldLabel>
                  <a
                    href="#"
                    className="ml-auto inline-block text-sm underline-offset-4 hover:underline"
                  >
                    Forgot your password?
                  </a>
                </div>
                <Input id="password" type="password" required />
              </Field> */}
              <Field>
                {/* <Button type="submit">Login</Button> */}
                <Button variant="outline" type="button" onClick={handleGoogleLogin}>
                  Login with Google
                </Button>
                <FieldDescription className="text-center">
                  Back to <a href="/">Home</a>
                </FieldDescription>
              </Field>
            </FieldGroup>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
