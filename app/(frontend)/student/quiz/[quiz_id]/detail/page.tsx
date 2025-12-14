"use client";

import {
  Button,
  Card,
  CardBody,
  CardHeader,
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
  useDisclosure,
  Skeleton
} from "@heroui/react";
import {
  CalendarIcon,
  CaseUpper,
  HashIcon,
  FileDigit,
} from "lucide-react";
import { use, useEffect, useState } from "react";
import { useDispatch } from "react-redux";
import { useAppSelector } from "@/lib/hooks";
import QuizifyNavbar from "@/components/QuizifyNavbar";
import { ToastContainer } from "react-toastify";
import { selectStudentError, selectStudentMessage, selectStudentQuizDetail, selectStudentStatus, studentAction } from "@/lib/features/studentSlice";
import QuestionDetailCard from "@/components/student/QuestionDetailCard";

export default function Page({
  params,
}: {
  params: Promise<{ quiz_id: string; }>;
}) {
  const [addRequestStatus, setAddRequestStatus] = useState<"idle" | "pending">(
    "idle"
  );
  const dispatch = useDispatch();

  const quizDetail = useAppSelector(selectStudentQuizDetail);
  const studentStatus = useAppSelector(selectStudentStatus);
  const studentMessage = useAppSelector(selectStudentMessage);
  const studentError = useAppSelector(selectStudentError);

  const { isOpen, onOpen, onClose } = useDisclosure();
  const { quiz_id } = use(params);
  const [quizId, setQuizId] = useState(quiz_id);


  useEffect(() => {
    if (studentStatus == "idle") {
      dispatch(
        studentAction.fetchStudentQuizDetail({quiz_id: quizId})
      );
    }
  }, [dispatch, studentStatus, quizId, quizDetail]);

  const questionRender = quizDetail?.questions?.map(
    (item: any, index: number) => {
      return (
        <QuestionDetailCard
          key={index + 1}
          item={item}
          index={index}
          questionsLength={quizDetail?.questions.length}
        />
      );
    }
  );


    let content: React.ReactNode;

    if (
      (studentStatus == "idle" || studentStatus == "pending") &&
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
      studentStatus == "succeeded" ||
      studentStatus == "failed" ||
      addRequestStatus == "pending"
    ) {
      content = (
        <div className="flex h-full w-full overflow-hidden justify-center">
          {/* MAIN */}

          <div className="flex w-3/4 h-full overflow-hidden">
            <div className="flex flex-col w-full soal-box h-full p-4 py-6 gap-4 overflow-auto">
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
                {/* <span className="text-medium flex items-center gap-2">
                <ListTodo />
                {quizDetail?.corrected} dari{" "}
                {quizDetail?.questions.length} soal terkoreksi
              </span> */}
                <span className="text-medium flex items-center gap-2">
                  <FileDigit />
                  {parseFloat((quizDetail?.score).toFixed(2))} / 100
                </span>
                <span className="text-medium flex items-center gap-2">
                  <CalendarIcon />
                  {new Date(quizDetail?.submitted).toLocaleString(undefined, {
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </span>
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
      <Modal
        backdrop="blur"
        className="rounded-md"
        isOpen={isOpen}
        onClose={onClose}
      >
        <ModalContent>
          {(onClose) => (
            <>
              <ModalHeader className="flex flex-col gap-1">
                Answer Type
              </ModalHeader>
              <ModalBody className="text-white">
                Is the answer a picture?
              </ModalBody>
              <ModalFooter>
                <Button
                  color="default"
                  variant="bordered"
                  className="rounded-md border-white"
                  onPress={() => handleCloseModal(false)}
                >
                  No
                </Button>
                <Button
                  className="rounded-md bg-white text-black"
                  color="default"
                  onPress={() => handleCloseModal(true)}
                >
                  Yes
                </Button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>
      
      {content}

    </div>
  );
}
