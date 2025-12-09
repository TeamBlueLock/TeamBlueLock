import { betterAuth } from "better-auth";
import { mongodbAdapter } from "better-auth/adapters/mongodb";
import { getDb } from "@/lib/mongo"; // your mongodb client 
import { connectToDatabase } from "@/lib/mongoose";
import { createAuthClient } from "better-auth/client";


export const auth = betterAuth({
  database: mongodbAdapter(await getDb()),
  emailAndPassword: {    
    enabled: true
}, 
  socialProviders: {
    google: { 
        prompt: "select_account",
        clientId: process.env.GOOGLE_CLIENT_ID as string, 
        clientSecret: process.env.GOOGLE_CLIENT_SECRET as string, 
    }, 
},
  //...
});

// const authClient = createAuthClient();
// const signIn = async () => {
//   const data = await authClient.signIn.social({
//     provider: "google",
//   });
// //   console.log(data);
// };

// signIn();