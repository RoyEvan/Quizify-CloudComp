"use client";

import QuizifyNavbar from "@/components/QuizifyNavbar";
import QuizCreatedCard from "@/components/teacher/QuizCreatedCard";
import {
  selectTeacherError,
  selectTeacherMessage,
  selectTeacherQuizCreated,
  selectTeacherStatus,
  teacherAction,
} from "@/lib/features/teacherSlice";
import { useAppSelector } from "@/lib/hooks";
import { teacherSchema } from "@/lib/validation/validation";
import { joiResolver } from "@hookform/resolvers/joi";
import { parseAbsoluteToLocal, ZonedDateTime } from "@internationalized/date";
import {
  Button,
  Card,
  CardBody,
  CardHeader,
  Input,
  Alert,
  DateRangePicker,
  Skeleton
} from "@heroui/react";
import { CaseUpper, HashIcon, SendHorizonal } from "lucide-react";
import { useEffect, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { useDispatch } from "react-redux";
import { toast, ToastContainer } from "react-toastify";

export default function Page() {
  const [addRequestStatus, setAddRequestStatus] = useState<"idle" | "pending">(
    "idle"
  );
  const dispatch = useDispatch();
  const quizCreated = useAppSelector(selectTeacherQuizCreated);
  const teacherStatus = useAppSelector(selectTeacherStatus);
  const teacherMessage = useAppSelector(selectTeacherMessage);
  const teacherError = useAppSelector(selectTeacherError);

  const {
    handleSubmit,
    formState: { errors },
    control,
  } = useForm({
    defaultValues: {
      title: "",
      datepick: {
        start: parseAbsoluteToLocal(
          new Date(Date.now() + 5 * 60 * 1000).toISOString()
        ), // Now Date Time to ISO
        end: parseAbsoluteToLocal(
          new Date(Date.now() + 86400000).toISOString()
        ), // Now+1 day Date Time to ISO
      },
      access_code: "",
    },

    resolver: joiResolver(teacherSchema),
  });

  const onSubmit = async (data: {
    title: string;
    datepick: { start: ZonedDateTime; end: ZonedDateTime };
    access_code: string;
  }) => {
    try {
      setAddRequestStatus("pending");
      await dispatch(
        teacherAction.postTeacherCreateQuiz({
          title: data.title,
          opened_at: data.datepick.start.toDate().toISOString(),
          ended_at: data.datepick.end.toDate().toISOString(),
          access_code: data.access_code,
        })
      ).unwrap();
    } catch (err) {
      console.error("Gagal Membuat Quiz");
    } finally {
      setAddRequestStatus("idle");
    }
  };

  const onDelete = async (quizId) => {
    try {
      setAddRequestStatus("pending");
      await dispatch(teacherAction.deleteTeacherQuiz(quizId)).unwrap();
    } catch (err) {
      console.error("Gagal Mengapus Quiz");
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
      dispatch(teacherAction.fetchTeacherAllQuiz());
    }
  }, [dispatch, teacherStatus, teacherError, teacherMessage]);

  const quizRender = quizCreated.map((item: any, index: number) => {
    return <QuizCreatedCard item={item} key={index} onDelete={onDelete} />;
  });

  let content: React.ReactNode;

  if (
    (teacherStatus == "idle" || teacherStatus == "pending") &&
    addRequestStatus == "idle"
  ) {
    content = (
      <div className="flex justify-center items-center overflow-auto h-full max-h-full">
        <div className="flex h-full flex-col gap-4 w-2/3 overflow-auto p-4">
          <h1 className="text-2xl text-left font-bold">Daftar Quiz</h1>
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

        <div className="flex min-h-full border-l-1 border-neutral-700 gap-4 w-1/3 overflow-hidden">
          <Card className="flex flex-col w-full h-full gap-4 overflow-auto  p-4 rounded-none bg-black">
            <CardHeader className="flex-col items-start p-0">
              <h1 className="text-2xl font-bold">Buat Quiz Baru</h1>
            </CardHeader>
            <CardBody className="p-0">
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
      <div className="flex justify-center items-center overflow-auto h-full max-h-full">
        <div className="flex h-full flex-col gap-4 w-2/3 overflow-auto p-4">
          <h1 className="text-2xl text-left font-bold">Daftar Quiz</h1>
          {quizRender}
        </div>

        <div className="flex min-h-full border-l-1 border-neutral-700 gap-4 w-1/3 overflow-hidden">
          <Card className="flex flex-col w-full h-full gap-4 overflow-auto  p-4 rounded-none bg-black">
            <CardHeader className="flex-col items-start p-0">
              <h1 className="text-2xl font-bold">Buat Quiz Baru</h1>
            </CardHeader>
            <CardBody className="p-0">
              <form
                className="flex flex-col gap-4 items-center"
                onSubmit={handleSubmit(onSubmit)}
              >
                <div className="flex w-full gap-2">
                  <Controller
                    name="title"
                    control={control}
                    render={({ field }) => (
                      <div className="flex flex-col w-3/5">
                        <Input
                          type="text"
                          label="Judul Quiz"
                          radius="sm"
                          isInvalid={errors.title ? true : false}
                          errorMessage={errors.title?.message}
                          placeholder="React Quiz"
                          labelPlacement="outside"
                          {...field}
                          startContent={
                            <CaseUpper className="text-2xl text-default-400 pointer-events-none flex-shrink-0" />
                          }
                        />
                      </div>
                    )}
                  />

                  <Controller
                    name="access_code"
                    control={control}
                    render={({ field }) => (
                      <div className="flex flex-col w-2/5">
                        <Input
                          type="access_code"
                          label="Kode Akses"
                          radius="sm"
                          isInvalid={errors.access_code ? true : false}
                          errorMessage={errors.access_code?.message}
                          placeholder="CLASS1234"
                          labelPlacement="outside"
                          {...field}
                          startContent={
                            <HashIcon className="text-2xl text-default-400 pointer-events-none flex-shrink-0" />
                          }
                        />
                      </div>
                    )}
                  />
                </div>

                <Controller
                  name="datepick"
                  control={control}
                  render={({ field: { onChange, value } }) => (
                    <div className="flex flex-col w-full">
                      <DateRangePicker
                        labelPlacement="outside"
                        label="Masa Waktu Pengerjaan"
                        hideTimeZone={true}
                        isInvalid={errors.datepick ? true : false}
                        errorMessage={errors.datepick?.message}
                        minValue={parseAbsoluteToLocal(
                          new Date().toISOString()
                        )}
                        radius="sm"
                        granularity="minute"
                        hourCycle={24}
                        value={value}
                        onChange={(newValue) => {
                          onChange(newValue); // Updates the value in React Hook Form
                        }}
                      />
                    </div>
                  )}
                />

                <Button
                  className="rounded-md bg-primary-400 mt-4 font-bold w-full"
                  endContent={<SendHorizonal className="h-1/2" />}
                  type="submit"
                >
                  Tambah Quiz
                </Button>
              </form>
            </CardBody>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="flex max-h-svh  h-screen flex-col">
      <QuizifyNavbar />

      <ToastContainer />

      {content}
    </div>
  );
}
