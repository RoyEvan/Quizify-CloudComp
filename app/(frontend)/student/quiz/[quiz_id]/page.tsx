"use client";
import QuestionCard from "@/components/QuestionCard";
import Questions from "@/types/question";
import { Button, Alert, Skeleton } from "@heroui/react";
import {
  Card,
  CardBody,
  CardHeader,
} from "@heroui/card";
import CountdownTimer from "@/components/student/CountdownTimer";
import {
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
  useDisclosure,
} from "@heroui/modal";
import { useRouter } from "next/navigation";
import { use, useEffect, useState } from "react";

import { useDispatch } from "react-redux";
import { Send, SendHorizonal } from "lucide-react";
import {
  selectStudentError,
  selectStudentMessage,
  selectStudentQuizActive,
  selectStudentStatus,
  studentAction,
} from "@/lib/features/studentSlice";
import { useAppSelector } from "@/lib/hooks";

import QuizifyNavbar from "@/components/QuizifyNavbar";
import { toast, ToastContainer } from "react-toastify";

export default function Page({ params }: { params: Promise<{ quiz_id: string }> }) {
  const router = useRouter();
  let { isOpen, onOpen, onClose } = useDisclosure();

  // redux

  const [addRequestStatus, setAddRequestStatus] = useState<"idle" | "pending">(
    "idle"
  );

  const dispatch = useDispatch();

  const quizActive = useAppSelector(selectStudentQuizActive);
  const studentStatus = useAppSelector(selectStudentStatus);
  const studentMessage = useAppSelector(selectStudentMessage);
  const studentError = useAppSelector(selectStudentError);

  const [currentQuestionSeq, setCurrentQuestionSeq] = useState<number>(1);

  const { quiz_id } = use(params);

  const [modalValue, setModalValue] = useState({
    title: "Quiz Not Found!",
    desc: "404",
    btn_text: "",
    btn_func: () => {
      router.push("/");
    },
  });

  // Question sekarang yang sedang ditampilkan sekarang
  let questionNow: Questions;

  const handleClose = () => {
    onClose();
  };

  // FETCH QUESTIONS
  useEffect(() => {
    if (studentMessage) {
      if (studentError) {
        toast(<Alert color={"danger"} radius="sm" title={studentMessage} />, {
          closeButton: false,
          className: "p-0 bg-black rounded-md",
        });
      } else {
        toast(<Alert color={"success"} radius="sm" title={studentMessage} />, {
          closeButton: false,
          className: "p-0 bg-black rounded-md",
        });
      }
    }

    if (studentStatus == "idle") {
      dispatch(studentAction.fetchStudentQuizActive());
    }
  }, [dispatch, quizActive, studentStatus, studentMessage, studentError]);

  const changeQuestion = (event: React.MouseEvent<HTMLButtonElement>) => {
    const changeTo: number = parseInt(
      event.currentTarget.dataset.question ?? "1"
    );
    if (
      quizActive?.questions.length > 0 &&
      changeTo <= quizActive?.questions.length &&
      changeTo >= 1
    ) {
      setCurrentQuestionSeq(changeTo);
    }
  };

  const updateAnswer = async (data: string | number | boolean) => {
    try {
      setAddRequestStatus("pending");
      await dispatch(
        studentAction.putStudentUpdateAnswer({
          quiz_id,
          question_id: questionNow.id,
          new_answer: data,
        })
      ).unwrap();
    } catch (err) {
      console.log("Gagal Mengubah Jawaban");
    } finally {
      setAddRequestStatus("idle");
    }
  };

  const questionNowRender = quizActive?.questions.map((item: Questions) => {
    if (item.rand_seq === currentQuestionSeq) {
      questionNow = item;

      return (
        <QuestionCard
          key={`question-${item.rand_seq}`}
          {...item}
          updateAnswer={updateAnswer}
        />
      );
    }
    return null;
  });

  // Aside Number Questions
  let className = "rounded-md";
  const numberOfQuestions = quizActive?.questions.map((item: Questions) => {
    let color: "default" | "primary" | "success" | "warning" | undefined =
      "default";
    const variant: "flat" | "solid" | "bordered" | undefined = "solid";

    if (item.rand_seq == currentQuestionSeq) {
      color = "primary";
      className = "rounded-md";
    } else if (item.answered == "1") {
      color = "success";
      className = "rounded-md";
    } else if (item.answered == "2") {
      color = "warning";
      className = "rounded-md";
    } else {
      className = "rounded-md bg-white text-black";
    }

    return (
      <Button
        key={`key-${item.rand_seq}`}
        isIconOnly
        color={color}
        className={className}
        variant={variant}
        onClickCapture={changeQuestion}
        data-question={item.rand_seq}
      >
        {item.rand_seq}
      </Button>
    );
  });

  const handleSubmit = () => {
    setModalValue({
      title: "Kumpulkan Quiz",
      desc: "Apakah Anda yakin untuk mengumpulkan Quiz ini?",
      btn_text: "Kumpulkan",
      btn_func: submitQuiz,
    });
    onOpen();
  };

  const submitQuiz = async () => {
    try {
      setAddRequestStatus("pending");
      await dispatch(studentAction.postStudentSubmitQuiz({})).unwrap();
    } catch (err) {
      console.log("Gagal Mengumpulkan Quiz");
    } finally {
      setAddRequestStatus("idle");
    }

    router.push("/student");
  };

  // Tombol Save For Later
  const saveForLater = async () => {
    // calls api to save quiz for later

    try {
      setAddRequestStatus("pending");
      await dispatch(
        studentAction.patchStudentSaveUnsaveQuestion({
          quiz_id,
          question_id: questionNow.id,
        })
      ).unwrap();
    } catch (err) {
      console.log("Gagal Menandai Pertanyaan");
    } finally {
      setAddRequestStatus("idle");
    }
  };

  // Tombol Unsave
  const unsaveQuestion = async () => {
    // calls api to save quiz for later

    try {
      setAddRequestStatus("pending");
      await dispatch(
        studentAction.patchStudentSaveUnsaveQuestion({
          quiz_id,
          question_id: questionNow.id,
        })
      ).unwrap();
    } catch (err) {
      console.log("Gagal menghapus tanda Pertanyaan");
    } finally {
      setAddRequestStatus("idle");
    }
  };

  let content: React.ReactNode;

  if (
    (studentStatus == "idle" || studentStatus == "pending") &&
    addRequestStatus == "idle"
  ) {
    content = (
      <div className="flex h-full overflow-auto p-4 gap-4">
        {/* LOADING / SOAL */}
        <div className="flex flex-col w-9/12 h-full">
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
        {/* QUESTIONS NUMBER DETAIL SIDEBAR */}
        <Card className="w-3/12 space-y-5 p-4" radius="sm">
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
    );
  } else if (
    studentStatus == "succeeded" ||
    studentStatus == "failed" ||
    addRequestStatus == "pending"
  ) {
    content = (
      <div className="flex h-full overflow-auto">
        {/* LOADING / SOAL */}
        <div className="flex flex-col w-9/12 h-full">
          {/* QUESTION DETAILS */}
          {questionNowRender}

          {/* QUESTION ACTION */}
          <div className="flex bg-neutral-950 p-4 border-neutral-700 border-t-0 justify-between">
            <Button
              className="p-4 bg-white text-black rounded-md"
              color="default"
              variant="solid"
              onClick={changeQuestion}
              data-question={currentQuestionSeq - 1}
            >
              <p className="font-bold">Sebelumnya</p>
            </Button>
            {questionNow?.answered == "2" ? (
              <Button
                className="rounded-md "
                color="warning"
                onClick={unsaveQuestion}
              >
                <p className="font-bold">Hilangkan Tanda Soal Ini</p>
              </Button>
            ) : (
              <Button
                variant="bordered"
                className="rounded-md border-1"
                color="warning"
                onClick={saveForLater}
              >
                <p className="font-bold">Tandai Soal Ini</p>
              </Button>
            )}
            {currentQuestionSeq == quizActive.questions.length ? (
              <Button
                className="rounded-md"
                color="primary"
                onClick={handleSubmit}
                endContent={<SendHorizonal className="w-4" />}
              >
                Kumpulkan
              </Button>
            ) : (
              <Button
                className="p-4 bg-white text-black rounded-md"
                color="default"
                onClick={changeQuestion}
                data-question={currentQuestionSeq + 1}
              >
                <p className="font-bold">Selanjutnya</p>
              </Button>
            )}
          </div>
        </div>
        {/* QUESTIONS NUMBER DETAIL SIDEBAR */}
        <div className="flex flex-col w-3/12 h-full overflow-hidden bg-black rounded-none border-neutral-700 border-l-1">
          <CountdownTimer timeLeft={quizActive.remainingTime} />
          <Card className="flex w-full h-full bg-black py-4 ps-4 gap-4">
            <CardHeader className="p-0">
              <p className="font-bold">Daftar Nomor</p>
            </CardHeader>
            <CardBody className="p-0">
              <div className="list-nomor-soal">{numberOfQuestions}</div>
            </CardBody>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="student-quiz flex h-screen max-h-svh flex-col">
      <QuizifyNavbar />
      <ToastContainer />

      {/* MODAL */}
      <Modal
        className="border-neutral-700 border-1 rounded-md"
        size="xl"
        isOpen={isOpen}
        onClose={handleClose}
      >
        <ModalContent>
          <ModalHeader className="flex flex-col gap-1">
            {modalValue.title}
          </ModalHeader>
          <ModalBody>
            <p>{modalValue.desc}</p>
          </ModalBody>
          <ModalFooter>
            <Button
              className="rounded-md "
              color="primary"
              onPress={modalValue.btn_func}
              endContent={<Send className="w-4" />}
            >
              {modalValue.btn_text}
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      <ToastContainer />

      {content}
    </div>
  );
}
