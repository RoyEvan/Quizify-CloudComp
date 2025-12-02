import NextAuth from "next-auth";
import GoogleProvider from "next-auth/providers/google";

const handler = NextAuth({
  providers: [
    GoogleProvider({
      clientId: process.env.QUIZIFY_GOOGLE_TEACHER_CLIENT_ID!,
      clientSecret: process.env.QUIZIFY_GOOGLE_TEACHER_CLIENT_SECRET!,
      id: "google-teacher",
      name: "Google (Teacher)",
    }),
    GoogleProvider({
      clientId: process.env.QUIZIFY_GOOGLE_STUDENT_CLIENT_ID!,
      clientSecret: process.env.QUIZIFY_GOOGLE_STUDENT_CLIENT_SECRET!,
      id: "google-student",
      name: "Google (Student)",
    })
  ],
  secret: process.env.QUIZIFY_NEXTAUTH_SECRET,
  session: {
    maxAge: 60 * 60 * 8, // 8 hours
    strategy: 'jwt',
  },
  pages: {
    error: '/',
    signIn: '/',
  },
  callbacks: {
    async signIn({ user, account }) {
      try {
        const URL = process.env.QUIZIFY_NEXTAUTH_URL;

        // google-teacher || google-student => [google, teacher||student] => teacher||student
        const type: string  = account!.provider.split("-")[1];
        const res = await fetch(`${URL}/api/signup`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            email: user.email,
            name: user.name,
            type,
            // image: 
          })
        });
        
        if(!res.ok) return false;

        return true;
      }
      catch (error) {
        // console.error('Error during user registration:', error);
        return false;
      }
    },
    async jwt ({ token, user, account }) {
      if(user) {
        const URL = process.env.QUIZIFY_NEXTAUTH_URL;

        const type = account?.provider.split("-")[1];
        

        // Mengambil id user dari database
        const res = await fetch(`${URL}/api/signin`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            email: user.email,
            type
          })
        });

        const user_id = await res.json();
      
        token.type = type;
        token.user_id = user_id;
      }

      return token;
    },
    async session({ session, token }) {
      session.user!.type = token.type;
      session.user!.user_id = token.user_id;
      
      return session;
    }
  }
});

export { handler as GET, handler as POST };