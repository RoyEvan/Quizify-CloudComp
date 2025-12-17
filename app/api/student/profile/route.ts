import { studentCol } from "@/types/collections/studentCol";
import { getToken } from "next-auth/jwt";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  try {
    const token = await getToken({req, secret: process.env.QUIZIFY_NEXTAUTH_SECRET});
    const student_id: string = token!.user_id!.toString();
    if (!student_id) {
      return NextResponse.json("Akses tidak terotorisasi!", { status: 401 });
    }

    const studentSnap = await studentCol.doc(student_id).get();
    if (!studentSnap.exists) {
      return NextResponse.json("Siswa tidak ditemukan!", { status: 404 });
    }

    const data = { _id: studentSnap.id, ...studentSnap.data() };
    return NextResponse.json(data, { status: 200 })
  }
  catch(err) {
    console.log(err);
    
    return NextResponse.json("Gagal!", { status: 500 })
  }
}

//untuk update profile
export async function POST(req: NextRequest) {
  try {
    const token = await getToken({req, secret: process.env.QUIZIFY_NEXTAUTH_SECRET});
    const student_id: string = token!.user_id!.toString();
    if (!student_id) {
      return NextResponse.json("Akses tidak terotorisasi!", { status: 401 });
    }
    const nickname = req.headers.get("nickname");
    const fullname = req.headers.get("name");
    
    await studentCol.doc(student_id).update({ nickname, fullname });

    return NextResponse.json("Profil berhasil diubah!", { status: 200 });
  }
  catch(err) {
    console.error(err);
  }

  return NextResponse.json("Gagal!", { status: 500 });
}