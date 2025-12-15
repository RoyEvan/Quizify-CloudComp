
import { getToken } from 'next-auth/jwt';
import { NextResponse, NextRequest } from 'next/server';
 
// This function can be marked `async` if using `await` inside
export async function proxy(request: NextRequest) {  
  const token = await getToken({ req: request, secret: process.env.QUIZIFY_NEXTAUTH_SECRET });

  const path = request.nextUrl.pathname;
  const isTeacherRoute = path.startsWith("/teacher") || path.startsWith("/api/teacher");
  const isStudentRoute = path.startsWith("/student") || path.startsWith("/api/student");
  const quizifyUrl = process.env.QUIZIFY_NEXTAUTH_URL;
  
  const isLoginRoute = path.startsWith("/") && !isTeacherRoute && !isStudentRoute;
  const isLoginApi = path.startsWith("/api/auth") || path.startsWith("/api/signin") || path.startsWith("/api/signup");

  if (token && (isLoginApi || isLoginRoute)) {
    /**
     *  Pada code ini, dia akan mengecek apakah dia adalah seorang guru atau murid
     *  Jika dia adalah seorang murid, maka akan diarahkan ke /student
     *  Jika dia adalah seorang guru, maka akan diarahkan ke /teacher
    **/
    
   
    if(token.type === "student") {
      return NextResponse.redirect(new URL('/student', quizifyUrl));
    }
    else if(token.type === "teacher") {
      return NextResponse.redirect(new URL('/teacher', quizifyUrl));
    }
  }

  if(token && (isTeacherRoute || isStudentRoute)) {
    // Jika user berusaha membuka halaman yang bukan rolenya, maka:
    if(isTeacherRoute && token.type === "student") {
      return NextResponse.redirect(new URL('/student', quizifyUrl));
    }
    else if(isStudentRoute && token.type === "teacher") {
      return NextResponse.redirect(new URL('/teacher', quizifyUrl));
    }
  }

  if(!token && (isTeacherRoute || isStudentRoute)) {
    return NextResponse.redirect(new URL('/', quizifyUrl));
  }

  return NextResponse.next();  
}
 
export const config = {
  matcher: [
    '/api/student/:path*',
    '/api/teacher/:path*',
    '/student/:path*',
    '/teacher/:path*',
    '/'
  ],
}