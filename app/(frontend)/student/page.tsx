"use client";

import QuizifyNavbar from "@/components/QuizifyNavbar";
import HistoryDoneCard from "@/components/student/HistoryDoneCard";

import {
  selectStudentQuizJoined,
  selectStudentQuizDone,
  selectStudentStatus,
  studentAction,
  selectStudentQuizAttempted,
  selectStudentMessage,
  selectStudentError,
} from "@/lib/features/studentSlice";

import { useAppSelector } from "@/lib/hooks";
import Quiz from "@/types/quiz";
import {
  Button,
  Input,
  Alert,
  Chip,
  Skeleton
} from "@heroui/react";
import { Card, CardBody, CardHeader } from "@heroui/card";
import { CalendarCheck, CalendarIcon, CircleAlert, Hash } from "lucide-react";
import { useEffect, useState } from "react";

import { Controller, useForm } from "react-hook-form";
import { useDispatch } from "react-redux";
import { toast, ToastContainer } from "react-toastify";

export default function Page() {
  const [addRequestStatus, setAddRequestStatus] = useState<"idle" | "pending">(
    "idle"
  );

  const dispatch = useDispatch();

  const historyAttempted = useAppSelector(selectStudentQuizAttempted);
  const historyDone = useAppSelector(selectStudentQuizDone);
  const historyJoined = useAppSelector(selectStudentQuizJoined);
  const studentStatus = useAppSelector(selectStudentStatus);
  const studentMessage = useAppSelector(selectStudentMessage);
  const studentError = useAppSelector(selectStudentError);

  const {
    handleSubmit,
    // formState: { errors },
    control,
  } = useForm({
    defaultValues: {
      access_code: "",
    },
  });

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
      dispatch(studentAction.fetchStudentAllQuiz());
    }
  }, [dispatch, studentStatus, historyAttempted, studentMessage]);

  const onAttempt = async (quiz_id: string) => {
    try {
      setAddRequestStatus("pending");
      await dispatch(
        studentAction.postStudentAttemptQuiz({ quiz_id })
      ).unwrap();
    } catch (err) {
      console.log("Gagal Memulai Quiz");
    } finally {
      setAddRequestStatus("idle");
    }
  };

  const onSubmit = async (data: { access_code: string }) => {
    const formData = {
      ...data,
    };

    try {
      setAddRequestStatus("pending");
      await dispatch(
        studentAction.postStudentJoinQuiz({ access_code: formData.access_code })
      ).unwrap();
    } catch (err) {
      console.log("Gagal Gabung Quiz");
    } finally {
      setAddRequestStatus("idle");
    }
  };

  const historyDoneRender = historyDone.map((item: Quiz, index: number) => {
    return <HistoryDoneCard key={`done-${index}`} item={item} index={index} />;
  });

  const historyJoinedRender = historyJoined.map((item: Quiz, index: number) => {
    return (
      <Card
        key={`joined-${index}`}
        className="bg-neutral-950 p-4 gap-4 h-fit min-h-fit rounded-md border-neutral-700 border-1"
      >
        <CardHeader className="flex p-0 justify-between">
          <h1 className="text-2xl font-bold">{item.title}</h1>
          {historyAttempted?.length != null ? (
            <Chip
              color="warning"
              variant="flat"
              startContent={<CircleAlert size={18} />}
            >
              Selesaikan Quiz Aktif
            </Chip>
          ) : (
            <Button
              onClick={() => {onAttempt(item._id)}}
              className="rounded-md flex w-fit bg-primary-400"
            >
              Mulai
            </Button>
          )}
        </CardHeader>
        <CardBody className="flex p-0">
          <span className="text-large flex items-center gap-2">
            <CalendarIcon />
            {new Date(item.quiz_started).toLocaleString(undefined, {
              day: "numeric",
              month: "long",
              year: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            })}
          </span>
          <span className="text-large flex items-center gap-2">
            <CalendarCheck />
            {new Date(item.quiz_ended).toLocaleString(undefined, {
              day: "numeric",
              month: "long",
              year: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            })}
          </span>
        </CardBody>
      </Card>
    );
  });

  let content: React.ReactNode;

  if (
    (studentStatus == "idle" || studentStatus == "pending") &&
    addRequestStatus == "idle"
  ) {
    content = (
      <div className="flex p-4 gap-4 w-screen">
        <div className="flex flex-col gap-4 w-full">
          <h2 className="text-xl font-bold">Quiz Terselesaikan</h2>
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
        <div className="flex flex-col gap-4 w-full">
          <h2 className="text-xl font-bold">Quiz Tergabung</h2>
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
    );
  } else if (
    studentStatus == "succeeded" ||
    studentStatus == "failed" ||
    addRequestStatus == "pending"
  ) {
    content = (
      <div className="flex h-full w-full  overflow-hidden">
        <div className="flex flex-col overflow-auto gap-8 w-1/2  border-r-1 border-neutral-700">
          <div className="flex flex-col gap-4 h-full overflow-hidden">
            <h2 className="text-xl pt-4 px-4 font-bold">Quiz Terselesaikan</h2>
            <div className="overflow-auto px-4 pb-4 flex flex-col gap-4">
              {historyDoneRender}
            </div>
          </div>
        </div>
        <div className="flex flex-col w-1/2 ">
          <form
            className="flex w-full pb-4 p-4"
            onSubmit={handleSubmit(onSubmit)}
          >
            <div className="flex w-full gap-2 items-end">
              <Controller
                name="access_code"
                control={control}
                render={({ field }) => (
                  <Input
                    type="text"
                    label="Join Quiz"
                    radius="sm"
                    placeholder="Access Code"
                    labelPlacement="outside"
                    {...field}
                    startContent={
                      <Hash className="text-2xl text-default-400 pointer-events-none flex-shrink-0" />
                    }
                  />
                )}
              />
              <Button
                className="rounded-md bg-white text-black font-bold"
                type="submit"
              >
                Gabung
              </Button>
            </div>
          </form>

          {historyAttempted && typeof historyAttempted === "object" && Object.keys(historyAttempted).length > 0 ? (
            <div className="flex flex-col gap-4 h-max">
              <h2 className="text-xl font-bold px-4">Quiz Aktif</h2>
              <div className="overflow-auto px-4 pb-4 flex flex-col gap-4">
                <Card className="bg-neutral-950 p-4 gap-4 h-fit min-h-fit rounded-md border-neutral-700 border-1">
                  <CardHeader className="flex p-0 justify-between">
                    <h1 className="text-2xl font-bold">
                      {historyAttempted.title}
                    </h1>
                    <a href={`student/quiz/${historyAttempted._id}`}>
                      <Button className="rounded-md flex w-fit bg-primary-400">
                        Kerjakan
                      </Button>
                    </a>
                  </CardHeader>
                  <CardBody className="flex p-0">
                    <span className="text-large flex items-center gap-2">
                      <CalendarIcon />
                      {new Date(historyAttempted.quiz_started).toLocaleString(
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
                    <span className="text-large flex items-center gap-2">
                      <CalendarCheck />
                      {new Date(historyAttempted.quiz_ended).toLocaleString(
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
                  </CardBody>
                </Card>
              </div>
            </div>
          ) : (
            ""
          )}

          <div className="flex flex-col gap-4 h-full overflow-hidden">
            <h2 className="text-xl font-bold px-4">Quiz Tergabung</h2>
            <div className="overflow-auto px-4 pb-4 flex flex-col gap-4">
              {historyJoinedRender}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="student-quiz flex h-screen max-h-svh flex-col">
      <QuizifyNavbar />
      <ToastContainer />

      {content}
    </div>
  );
}
