import { authClient } from "@/lib/auth-client"; //import the auth client

await authClient.signIn.social({
    /**
     * The social provider ID
     * @example "github", "google", "apple"
     */
    provider: "google",
    /**
     * A URL to redirect after the user authenticates with the provider
     */
    callbackURL: "/dashboard/Overview", // change to "/profit-analysis" if that's your default
    /**
     * A URL to redirect if an error occurs during the sign in process
     */
    errorCallbackURL: "/error",
    /**
     * A URL to redirect if the user is newly registered
     */
    newUserCallbackURL: "/dashboard/Overview", // change to "/profit-analysis" if that's your default
});