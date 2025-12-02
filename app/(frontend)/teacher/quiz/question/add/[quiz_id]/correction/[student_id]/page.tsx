"use client";

import {
  Alert,
  Button,
  Card,
  CardBody,
  CardHeader,
  Skeleton
} from "@heroui/react";
import {
  CalendarIcon,
  CaseUpper,
  HashIcon,
  SendHorizonal,
  ListTodo,
  FileDigit,
  User,
} from "lucide-react";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { useDispatch } from "react-redux";
import {
  selectTeacherError,
  selectTeacherMessage,
  selectTeacherQuizCheck,
  selectTeacherStatus,
  teacherAction,
  teacherReducerAction,
} from "@/lib/features/teacherSlice";
import { useAppSelector } from "@/lib/hooks";
import QuizifyNavbar from "@/components/QuizifyNavbar";
import { toast, ToastContainer } from "react-toastify";
import QuestionCheckCard from "@/components/teacher/QuestionCheckCard";

export default function Page({ params }: { params: { quiz_id: string; student_id: string }; }) {
  const [addRequestStatus, setAddRequestStatus] = useState<"idle" | "pending">("idle");
  const dispatch = useDispatch();

  const quizDetail = useAppSelector(selectTeacherQuizCheck);
  const teacherStatus = useAppSelector(selectTeacherStatus);
  const teacherMessage = useAppSelector(selectTeacherMessage);
  const teacherError = useAppSelector(selectTeacherError);

  const quizId = params.quiz_id;
  const studentId = params.student_id;

  const {
    formState: { errors },
    watch,
  } = useForm({
    defaultValues: {
      title: "",
      type: "question-type-pg",
      answers: [{ answer: "", img: false }],
      answer_key: "",
      img: "",
    },
    // resolver: joiResolver(questionSchema),
  });

  const updateNilai = async (question_id, nilai) => {
    try {
      dispatch(
        teacherReducerAction.updateNilai({
          question_id,
          nilai,
          max_nilai: 10,
        })
      );
    } catch (err) {
      toast(<Alert color={"danger"} radius="sm" title="Gagal Update Nilai" />, {
        closeButton: false,
        className: "p-0 bg-black rounded-md",
      });
    } finally {
      setAddRequestStatus("idle");
    }
  };

  useEffect(() => {
    if (teacherMessage) {
      if (teacherError) {
        toast(<Alert color={"danger"} radius="sm" title={teacherMessage} />, {
          closeButton: false,
          className: "p-0 bg-black rounded-md",
        });
      } else {
        toast(<Alert color={"success"} radius="sm" title={teacherMessage} />, {
          closeButton: false,
          className: "p-0 bg-black rounded-md",
        });
      }
    }

    if (teacherStatus == "idle") {
      dispatch(
        teacherAction.fetchTeacherQuizCheck({
          quiz_id: quizId,
          student_id: studentId,
        })
      );
    }
  }, [
    dispatch,
    teacherStatus,
    quizId,
    studentId,
    watch,
    quizDetail,
    teacherMessage,
    teacherError,
  ]);

  const questionRender = quizDetail?.questions?.map(
    (item: any, index: number) => {
      return (
        <QuestionCheckCard
          key={index + 1}
          item={item}
          index={index}
          quizDetail={quizDetail}
          updateNilai={updateNilai}
        />
      );
    }
  );

  const handleSubmitNilai = async (data: any) => {
    try {
      setAddRequestStatus("pending");
      await dispatch(
        teacherAction.putTeacherQuizNilai({
          quiz_id: quizId,
          student_id: studentId,
          questions: quizDetail.questions,
          result: quizDetail.result,
        })
      ).unwrap();
    } catch (err) {
      console.log("Gagal Submit Nilai");
    } finally {
      setAddRequestStatus("idle");
    }
  };

  let content: React.ReactNode;

  if (
    (teacherStatus == "idle" || teacherStatus == "pending") &&
    addRequestStatus == "idle"
  ) {
    content = (
      <div className="flex h-full w-full overflow-hidden justify-center">
        <div className="flex w-3/4 h-full overflow-hidden">
          <div className="flex w-full flex-col h-full tab-daftar-soal overflow-hidden p-4">
            <Card className="w-full space-y-5 p-4" radius="sm">
              <div className="space-y-3">
                <Skeleton className="w-3/5 rounded-lg">
                  <div className="h-3 w-3/5 rounded-lg bg-default-200" />
                </Skeleton>
                <Skeleton className="w-4/5 rounded-lg">
                  <div className="h-3 w-4/5 rounded-lg bg-default-200" />
                </Skeleton>
                <Skeleton className="w-2/5 rounded-lg">
                  <div className="h-3 w-2/5 rounded-lg bg-default-300" />
                </Skeleton>
              </div>
            </Card>
          </div>
        </div>

        <div className="flex flex-col w-1/4">
          <Card className="flex flex-col min-h-fit h-full gap-4 p-4 border-l-1 border-neutral-700 rounded-none bg-black">
            <CardHeader className="flex-col flex justify-start p-0 items-start">
              <h1 className="text-xl font-bold">Detail Quiz</h1>
            </CardHeader>
            <CardBody className="flex h-full flex-col p-0 gap-1">
              <Card className="w-full space-y-5 p-4" radius="sm">
                <div className="space-y-3">
                  <Skeleton className="w-3/5 rounded-lg">
                    <div className="h-3 w-3/5 rounded-lg bg-default-200" />
                  </Skeleton>
                  <Skeleton className="w-4/5 rounded-lg">
                    <div className="h-3 w-4/5 rounded-lg bg-default-200" />
                  </Skeleton>
                  <Skeleton className="w-2/5 rounded-lg">
                    <div className="h-3 w-2/5 rounded-lg bg-default-300" />
                  </Skeleton>
                </div>
              </Card>
            </CardBody>
          </Card>
        </div>
      </div>
    );
  } else if (
    teacherStatus == "succeeded" ||
    teacherStatus == "failed" ||
    addRequestStatus == "pending"
  ) {
    content = (
      <div className="flex h-full w-full overflow-hidden justify-center">
        {/* MAIN */}

        <div className="flex w-3/4 h-full overflow-hidden">
          <div className="flex flex-col w-full soal-box h-full p-4 py-6 gap-4 overflow-auto">
            <div className="flex w-full h-fit">
              <Alert
                color="primary"
                className="w-full h-min"
                title="Untuk menghindari pemberian nilai dalam bentuk desimal, setiap soal harus dinilai menggunakan skala 0-10. Program akan membantu menghitung nilai akhir untuk setiap soal."
              />
            </div>

            {quizDetail?.questions.length > 0 ? (
              questionRender
            ) : (
              <p>No Question Here....</p>
            )}
          </div>
        </div>

        {/* SIDEBAR ADD */}
        <div className="flex flex-col w-1/4">
          <Card className="flex flex-col min-h-fit h-full gap-4 p-4 border-l-1 border-neutral-700 rounded-none bg-black">
            <CardHeader className="flex-col flex justify-start p-0 items-start">
              <h1 className="text-xl font-bold">Detail Quiz</h1>
            </CardHeader>
            <CardBody className="flex h-full flex-col p-0 gap-1">
              <span className="text-medium flex items-center gap-2">
                <CaseUpper />
                {quizDetail?.quiz}
              </span>
              <span className="text-medium flex items-center gap-2">
                <HashIcon />
                {quizDetail?.access_code}
              </span>
              <span className="text-medium flex items-center gap-2">
                <User />
                {quizDetail?.student}
              </span>
              <span className="text-medium flex items-center gap-2">
                <ListTodo />
                {quizDetail?.result.corrected} dari{" "}
                {quizDetail?.questions.length} soal terkoreksi
              </span>
              <span className="text-medium flex items-center gap-2">
                <FileDigit />
                {parseFloat((quizDetail?.result.score).toFixed(2))} / 100
              </span>
              <span className="text-medium flex items-center gap-2">
                <CalendarIcon />
                {new Date(quizDetail?.result.submitted).toLocaleString(
                  undefined,
                  {
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  }
                )}
              </span>

              <Button
                className="rounded-md w-fit mt-4 w-full"
                onPress={handleSubmitNilai}
                color="primary"
                endContent={<SendHorizonal className="h-1/2" />}
              >
                Simpan Penilaian
              </Button>
            </CardBody>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="flex max-h-svh h-screen justify-center items-center flex-col">
      <QuizifyNavbar />

      <ToastContainer />

      {content}
    </div>
  );
}
