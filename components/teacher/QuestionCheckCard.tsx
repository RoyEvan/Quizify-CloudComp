import {
  cn,
  Chip,
  Image,
  Input,
  Textarea,
  Radio,
  RadioGroup,
  Card,
  CardBody,
  CardHeader
} from "@heroui/react";
import { useEffect, useRef, useState } from "react";

const QuestionCheckCard = ({ index, item, quizDetail, updateNilai }) => {
  const [nilai, setNilai] = useState((item.points / (100 / quizDetail.questions.length)) * 10);
  const inputNilai = useRef(null);

  const handleNilaiChange = () => {
    const value = parseInt(inputNilai.current?.value || null); // Get value directly from ref

    if (value < 0 || isNaN(value) || value == null) {      
      setNilai(null);
      inputNilai.current.value = null;
      updateNilai(item.id, (0 / 10) * (100 / quizDetail.questions.length)); // Update the val ue using the function
    } else if (value > 10) {
      setNilai(10);
      inputNilai.current.value = "10";
      updateNilai(item.id, (10 / 10) * (100 / quizDetail.questions.length)); // Update the val ue using the function
    }
    else {
      setNilai(value); // Get value from ref
      updateNilai(item.id, (value / 10) * (100 / quizDetail.questions.length)); // Update the val ue using the function
    }
  };

  const MultipleChoiceAnswers = (answers) => {
    const multipleChoiceAnswers = answers?.map((answer, index) => {
      let choice = "A".charCodeAt(0);
      choice += index;

      return (
        <Radio
          key={`${index}`}
          value={`${answer}`}
          classNames={{
            base: cn(
              // Normal COndition
              "opacity-100 m-0 px-0 bg-neutral-950 w-full items-start pe-2 max-w-full rounded-md border-1 border-neutral-700",
              "data-[selected=true]:border-primary"
            ),
          }}
        >
          <div className="flex gap-2 items-start">
            <div className="pilgan font-bold min-w-8 min-h-8 bg-neutral-700 rounded-sm flex aspect-square h-fit w-8  justify-center items-center">
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
    });

    return <div>{multipleChoiceAnswers}</div>;
  };

  return (
    <Card className="bg-neutral-950 px-4 py-2 pb-4 h-fit min-h-fit rounded-md border-neutral-700 border-1">
      <CardHeader className="flex gap-2 justify-between">
        <div className="flex gap-4 items-center">
          <div className="text-1xl font-bold bg-white text-black h-fit aspect-square min-w-8 w-8 justify-center flex items-center rounded-sm">
            {index + 1}
          </div>
          <h1 className="text-2xl font-bold">{item.title}</h1>
        </div>
        <div className="flex gap-2 items-center">
          <Input
            className="w-[152px]"
            label="Nilai Skala"
            size="sm"
            variant="underlined"
            labelPlacement="outside-left"
            max={100 / quizDetail.questions.length}
            min={0}
            type="number"
            radius="sm"
            placeholder="0-10"
            ref={inputNilai}
            value={nilai} // Bind state to input value
            onChange={handleNilaiChange}
          />
          <Chip radius="sm" color="success">
            {parseFloat(
              (
                ((nilai ? nilai : 0) / 10) *
                (100 / quizDetail.questions.length)
              ).toFixed(2)
            )}{" "}
            / {parseFloat((100 / quizDetail.questions.length).toFixed(2))}
          </Chip>
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
          <>
            <RadioGroup
              className="radio-list-soal w-full"
              isDisabled
              defaultValue={`${item.answers[item.answer]}`}
            >
              {MultipleChoiceAnswers(item.answers)}
            </RadioGroup>

            <span className="flex gap-2">
              <span>Kunci Jawaban:</span>
              <Chip className="rounded-sm" color="primary">
                {String.fromCharCode(
                  "A".charCodeAt(0) + parseInt(item.answer_key)
                )}
              </Chip>
              {/* <span>{item.answers[item.answer_key]}</span> */}
            </span>
          </>
        )}

        {item.type == "ur" && (
          <Textarea
            radius="sm"
            className="max-w-full"
            label="Jawaban Peserta"
            labelPlacement="outside"
            disabled
            value={item.answer}
          />
        )}
      </CardBody>
    </Card>
  );
};

export default QuestionCheckCard;
