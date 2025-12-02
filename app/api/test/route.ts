import { studentCol } from "@/types/collections/studentCol";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    // const buckets = await fileNameToGcpLink("679212c79518a512d9817ff9_679215df24b58fe3f978980d_answer_1.jpg");

    const studentSnap = await studentCol.where('email', '==', 'roy.e22@mhs.istts.ac.id').get();
    return NextResponse.json({ message: "Success Fetching Buckets", data: studentSnap.docs[0].data() }, { status: 200 });
  }
  catch (err) {
    console.log(err);
  }

  return NextResponse.json({ message: "Failed" }, { status: 500 });
}