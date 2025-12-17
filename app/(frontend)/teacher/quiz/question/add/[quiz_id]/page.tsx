"use client";

import {
  Alert,
  Button,
  Card,
  CardBody,
  CardFooter,
  CardHeader,
  Chip,
  Image,
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
  Radio,
  RadioGroup,
  Select,
  SelectItem,
  Skeleton,
  Switch,
  Tab,
  Tabs,
  useDisclosure,
  Input
} from "@heroui/react";
import {
  BookOpenCheck,
  CalendarIcon,
  CalendarCheck,
  CaseUpper,
  FilePlus,
  Files,
  LucideHash,
  Plus,
  HashIcon,
  Trash2
} from "lucide-react";
import { use, useEffect, useRef, useState } from "react";
import { Controller, useFieldArray, useForm } from "react-hook-form";
import { cn } from "@heroui/theme";
import { useDispatch } from "react-redux";
import {
  selectTeacherError,
  selectTeacherMessage,
  selectTeacherQuizActive,
  selectTeacherStatus,
  teacherAction,
} from "@/lib/features/teacherSlice";
import { useAppSelector } from "@/lib/hooks";
import QuizifyNavbar from "@/components/QuizifyNavbar";
import { toast, ToastContainer } from "react-toastify";

const FileUpload = (props: { onFileSelect: any; className?: string }) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      const file = files[0];
      setSelectedFile(file);
      if (props.onFileSelect) {
        props.onFileSelect(file);
      }
    }
  };

  const handlePilihFile = () => {
    fileInputRef.current!.click();
  };

  return (
    <div className="flex w-full">
      <input
        type="file"
        ref={fileInputRef}
        className="hidden"
        onChange={handleFileInput}
      />
      <div className="flex bg-neutral-800 w-full rounded-md gap-2">
        <Button
          className="w-fit bg-white text-black rounded-md"
          onPress={handlePilihFile}
          color="primary"
        >
          Pilih File
        </Button>
        {selectedFile ? (
          <p className="my-auto">Terpilih: {selectedFile.name}</p>
        ) : (
          <p className="my-auto">Pilih gambar [.jpg, .png]</p>
        )}
      </div>
    </div>
  );
};

export default function Page({ params }: { params: Promise<{ quiz_id: string }> }) {
  const [addRequestStatus, setAddRequestStatus] = useState<"idle" | "pending">("idle");
  const dispatch = useDispatch();

  const quizDetail = useAppSelector(selectTeacherQuizActive);
  const teacherStatus = useAppSelector(selectTeacherStatus);
  const teacherMessage = useAppSelector(selectTeacherMessage);
  const teacherError = useAppSelector(selectTeacherError);

  const [withImg, setWithImg] = useState(false);
  const { isOpen, onOpen, onClose } = useDisclosure();
  const { quiz_id: quizId } = use(params);

  const {
    register,
    handleSubmit,
    formState: { errors },
    control,
    watch,
    getValues,
    setValue,
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

  // Walaupun UNUSED, jangan dihapus karena somehow membantu get values
  // const selectedType = watch("type");
  watch("type");

  // const { fields, append, prepend, remove, swap, move, insert } = useFieldArray(
  const { fields, append, remove } = useFieldArray({
    control,
    name: "answers",
  });

  const handleAddAnswer = () => {
    onOpen();
  };

  const handleRemoveAnswer = (index: number) => {
    setValue("answer_key", "");
    remove(index);
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
      dispatch(teacherAction.fetchTeacherQuizActive(quizId));
    }
  }, [dispatch, teacherStatus, quizId, watch, teacherMessage, teacherError]);

  const onDeleteQuestion = async (question_id) => {
    try {
      setAddRequestStatus("pending");
      await dispatch(
        teacherAction.deleteTeacherQuestion({ quiz_id: quizId, question_id })
      ).unwrap();
    } catch (err) {
      console.log("Gagal Menghapus Pertanyaan");
    } finally {
      setAddRequestStatus("idle");
    }
  };

  const MultipleChoiceAnswers: any = (answers: string[]) => {
    const multipleChoiceAnswers = answers?.map(
      (answer: string, index: number) => {
        let choice = "A".charCodeAt(0);
        choice += index;

        return (
          <Radio
            key={`${index}`}
            value={`${answer}`}
            classNames={{
              base: cn(
                // Normal COndition
                "pilgan-item opacity-100 m-0 px-0 bg-neutral-950 w-full items-start pe-2 max-w-full rounded-md border-1 border-neutral-700",
                "data-[selected=true]:border-primary"
              ),
            }}
          >
            <div className="flex gap-2 items-start">
              <div className="ms-1 pilgan font-bold min-w-8 min-h-8 bg-neutral-700 rounded-sm flex aspect-square h-fit w-8 justify-center items-center">
                {String.fromCharCode(choice)}
              </div>

              <div>
                {answer.toString().startsWith("https://") ? (
                  <Image
                    radius="sm"
                    alt={String.fromCharCode(choice)}
                    src={answer.toString()}
                    width={1000}
                  />
                ) : (
                  answer
                )}
              </div>
            </div>
          </Radio>
        );
      }
    );

    // return <div>{multipleChoiceAnswers}</div>;
    return <div>{multipleChoiceAnswers}</div>;
  };

  const questionRender = quizDetail?.questions?.map(
    (item: any, index: number) => {
      return (
        <Card
          key={index + 1}
          className="bg-neutral-950 px-4 py-2 pb-4 h-fit min-h-fit rounded-md border-neutral-700 border-1"
        >
          <CardHeader className="flex gap-2 justify-between">
            <div className="flex gap-4 items-start">
              {/* No Soal */}
              <div className="text-1xl font-bold bg-white text-black h-fit aspect-square min-w-8 w-8 justify-center flex items-center rounded-sm">
                {index + 1}
              </div>
              <h1 className="text-2xl font-bold">{item.title}</h1>
            </div>
          </CardHeader>
          <CardBody className="flex gap-4">
            {item.img && (
              <Image
                isZoomed
                radius="sm"
                alt={item.title}
                src={item.img}
                width={320}
              />
            )}

            {item.type == "pg" && (
              <RadioGroup
                className="radio-list-soal w-full"
                isDisabled
                defaultValue={`${item.answers[item.answer_key]}`}
              >
                {MultipleChoiceAnswers(item.answers)}
              </RadioGroup>
            )}

            {item.type == "ur" && (
              <Alert
                color={"primary"}
                radius="sm"
                title={`Jawaban siswa perlu dikoreksi secara mandiri saat quiz berakhir`}
              />
            )}
          </CardBody>
          <CardFooter className="flex gap-2 justify-end items-center">
            <Button
              onClick={() => onDeleteQuestion(item.id.toString())}
              color="danger"
              className="rounded-md flex w-fit items-center gap-0 px-2 pe-4"
              startContent={<Trash2 className="h-1/2" />}
            >
              Hapus Soal Ini
            </Button>
          </CardFooter>
        </Card>
      );
    }
  );

  const submittedRender = quizDetail?.students_submitted?.map(
    (item: any, index: number) => {
      return (
        <Card
          key={`done-${index}`}
          className="bg-neutral-950 p-2 h-fit min-h-fit rounded-md border-neutral-700 border-1"
        >
          <CardHeader className="flex gap-3">
            <Chip radius="sm" color="success">
              {parseFloat(item.score).toFixed(2)} / 100
            </Chip>
            <h1 className="text-2xl font-bold">{item.fullname}</h1>
            <a href={`${quizId}/correction/${item._id}`} className="ml-auto">
              <Button className="rounded-md flex w-fit bg-white text-black">
                Koreksi
              </Button>
            </a>
          </CardHeader>
        </Card>
      );
    }
  );

  const onSubmit = async (data: any) => {

    const formData = new FormData();
    formData.append("title", data.title);
    formData.append("type", data.type);
    formData.append("answer_key", data.answer_key);
    formData.append("img", data.img);

    data.answers.map((choice: any, index: number) => {
      formData.append(`answers[${index}].answer`, choice.answer);
      formData.append(`answers[${index}].img`, choice.img);
    });

    try {
      setAddRequestStatus("pending");
      await dispatch(
        teacherAction.postTeacherAddQuestion({ quiz_id: quizId, formData })
      ).unwrap();
    } catch (err) {
      console.log("Gagal Membuat Pertanyaan");
    } finally {
      setAddRequestStatus("idle");
    }
  };


  const handleCloseModal = (hasImg: boolean) => {
    // setAnswerHasImage(hasImg);
    onClose();
    append({ answer: "", img: hasImg });
  };



  let content: React.ReactNode;

  if ((teacherStatus == "idle" || teacherStatus == "pending") && addRequestStatus == "idle") {
    content = (
      <div className="flex h-full w-full overflow-hidden justify-center">
        <div className="flex w-3/4 h-full overflow-hidden">
          <div className="flex w-full flex-col h-full tab-daftar-soal overflow-hidden">
            <Tabs
              aria-label="Options"
              radius="none"
              color="primary"
              fullWidth
              className="flex"
            >
              <Tab
                key="daftar_soal"
                className="overflow-hidden p-0 m-0"
                title={
                  <div className="flex items-center space-x-2">
                    <Files />
                    <span>Daftar Soal</span>
                  </div>
                }
              >
                <div className="flex flex-col soal-box h-full p-4 py-6 gap-4 overflow-auto">
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
              </Tab>
              <Tab
                key="tambah_soal"
                className="overflow-hidden p-0 m-0"
                title={
                  <div className="flex items-center space-x-2">
                    <FilePlus />
                    <span>Tambah Soal</span>
                  </div>
                }
              >
                <div className="flex flex-col h-full w-full p-4 overflow-auto">
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
              </Tab>
              <Tab
                key="penilaian"
                className="overflow-hidden p-0 m-0"
                title={
                  <div className="flex items-center space-x-2">
                    <BookOpenCheck />

                    <span>Penilaian</span>
                  </div>
                }
              >
                <div className="flex flex-col h-full gap-4 p-4 overflow-auto">
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
              </Tab>
            </Tabs>
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
  } else if (teacherStatus == "succeeded" || teacherStatus == "failed" || addRequestStatus == "pending") {
    content = (
      <div className="flex h-full w-full overflow-hidden justify-center">
        <div className="flex w-3/4 h-full overflow-hidden">
          <div className="flex w-full flex-col h-full tab-daftar-soal overflow-hidden">
            <Tabs
              aria-label="Options"
              radius="none"
              color="primary"
              fullWidth
              className="flex"
            >
              <Tab
                key="daftar_soal"
                className="overflow-hidden p-0 m-0"
                title={
                  <div className="flex items-center space-x-2">
                    <Files />
                    <span>Daftar Soal</span>
                  </div>
                }
              >
                <div className="flex flex-col soal-box h-full p-4 py-6 gap-4 overflow-auto">
                  {quizDetail?.questions.length > 0 ? (
                    questionRender
                  ) : (
                    <p>No Question Here....</p>
                  )}
                </div>
              </Tab>
              <Tab
                key="tambah_soal"
                className="overflow-hidden p-0 m-0"
                title={
                  <div className="flex items-center space-x-2">
                    <FilePlus />
                    <span>Tambah Soal</span>
                  </div>
                }
              >
                <div className="flex flex-col h-full w-full p-4 overflow-auto">
                  <form
                    className="flex flex-col gap-4"
                    onSubmit={handleSubmit(onSubmit)}
                  >
                    <div className="flex items-end gap-4">
                      <div className="w-1/4">
                        <Controller
                          name="type"
                          control={control}
                          render={({ field: { onChange, value } }) => (
                            <div>
                              <Select
                                radius="sm"
                                label="Tipe Soal"
                                placeholder="Pilih Tipe Soal"
                                labelPlacement="outside"
                                defaultSelectedKeys={["question-type-pg"]}
                                className=""
                                value={value}
                                onChange={onChange}
                              >
                                <SelectItem key="question-type-pg" value="pg">
                                  Pilihan Ganda
                                </SelectItem>
                                <SelectItem key="question-type-ur" value="ur">
                                  Uraian
                                </SelectItem>
                              </Select>
                              {errors.type && <p>{errors.type.message}</p>}
                            </div>
                          )}
                        />
                      </div>
                      <div className="w-3/4">
                        <Controller
                          name="title"
                          control={control}
                          render={({ field: { onChange, value } }) => (
                            <div>
                              <Input
                                label="Isi Soal"
                                labelPlacement="outside"
                                radius="sm"
                                placeholder="Apakah ini soal pertama?"
                                onValueChange={onChange}
                                value={value}
                                startContent={
                                  <LucideHash className="text-xl text-default-400 pointer-events-none flex-shrink-0" />
                                }
                              />
                              {errors.title && <p>{errors.title.message}</p>}
                            </div>
                          )}
                        />
                      </div>
                    </div>

                    <div className="flex gap-4 items-center min-h-12">
                      <Switch
                        size="sm"
                        className="w-full"
                        isSelected={withImg}
                        onValueChange={setWithImg}
                      >
                        Soal Bergambar?
                      </Switch>
                      {withImg && (
                        <Controller
                          name="img"
                          control={control}
                          render={({ field: { onChange } }) => (
                            <FileUpload
                              className="w-full"
                              onFileSelect={(file: any) => onChange(file)}
                            />
                          )}
                        />
                      )}
                    </div>

                    {getValues("type") != "question-type-pg" ? (
                      <Alert
                        color={"warning"}
                        radius="sm"
                        title={`Jawaban siswa perlu dikoreksi secara mandiri saat quiz berakhir`}
                      />
                    ) : (
                      <>
                        <Button
                          className="rounded-md w-fit bg-white text-black"
                          onClick={handleAddAnswer}
                          color="default"
                          startContent={<Plus />}
                        >
                          Tambah Jawaban Baru
                        </Button>

                        <Controller
                          name="answer_key"
                          control={control}
                          render={({ field: { onChange, value } }) => (
                            <RadioGroup onValueChange={onChange} value={value}>
                              {fields.map((field, index) => (
                                <div
                                  key={field.id}
                                  className="flex gap-2 items-center w-full"
                                >
                                  <Radio
                                    key={field.id}
                                    value={index.toString()}
                                  >
                                    <div className="pilgan-item flex items-center w-full">
                                      <div className="pilgan font-bold bg-neutral-700 rounded-sm flex aspect-square h-fit w-8 mr-2 justify-center items-center">
                                        {String.fromCharCode(
                                          "A".charCodeAt(0) + index
                                        )}
                                      </div>
                                    </div>
                                  </Radio>
                                  {field.img ? (
                                    <Controller
                                      name={`answers.${index}.answer` as const}
                                      control={control}
                                      render={({ field: { onChange } }) => (
                                        <FileUpload
                                          onFileSelect={(file: any) =>
                                            onChange(file)
                                          }
                                        />
                                      )}
                                    />
                                  ) : (
                                    <div className="w-full">
                                      <Input
                                        size="md"
                                        radius="sm"
                                        className="rounded-sm"
                                        {...register(
                                          `answers.${index}.answer` as const
                                        )}
                                        placeholder={`Jawaban ke ${index + 1}`}
                                      />
                                      {errors.answers &&
                                        errors.answers[index]?.answer && (
                                          <p className="text-red-500">
                                            {
                                              errors.answers[index]?.answer
                                                .message
                                            }
                                          </p>
                                        )}
                                    </div>
                                  )}
                                  <Button
                                    className="rounded-md bg-danger-400"
                                    onClick={() => handleRemoveAnswer(index)}
                                  >
                                    Hapus
                                  </Button>
                                </div>
                              ))}
                            </RadioGroup>
                          )}
                        />
                      </>
                    )}

                    <Button
                      className="rounded-md"
                      type="submit"
                      color="primary"
                      startContent={<Plus />}
                    >
                      Tambahkan Soal Ini
                    </Button>
                  </form>
                </div>
              </Tab>
              <Tab
                key="penilaian"
                className="overflow-hidden p-0 m-0"
                title={
                  <div className="flex items-center space-x-2">
                    <BookOpenCheck />

                    <span>Penilaian</span>
                  </div>
                }
              >
                <div className="flex flex-col h-full gap-4 p-4 overflow-auto">
                  {submittedRender}
                </div>
              </Tab>
            </Tabs>
          </div>
        </div>

        <div className="flex flex-col w-1/4">
          <Card className="flex flex-col min-h-fit h-full gap-4 p-4 border-l-1 border-neutral-700 rounded-none bg-black">
            <CardHeader className="flex-col flex justify-start p-0 items-start">
              <h1 className="text-xl font-bold">Detail Quiz</h1>
            </CardHeader>
            <CardBody className="flex h-full flex-col p-0 gap-1">
              <span className="text-medium flex items-center gap-2">
                <CaseUpper />
                {quizDetail?.title}
              </span>
              <span className="text-medium flex items-center gap-2">
                <HashIcon />
                {quizDetail?.access_code}
              </span>
              <span className="text-medium flex items-center gap-2">
                <CalendarIcon />
                {new Date(quizDetail?.quiz_started).toLocaleString(undefined, {
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </span>
              <span className="text-medium flex items-center gap-2">
                <CalendarCheck />
                {new Date(quizDetail?.quiz_ended).toLocaleString(undefined, {
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

      <ToastContainer 
        theme="dark"
      />
      <Modal
        backdrop="blur"
        className="rounded-md"
        isOpen={isOpen}
        onClose={onClose}
      >
        <ModalContent>
          {/* {(onClose) => ( */}
          {() => (
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
