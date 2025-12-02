import Quiz from '@/types/quiz';

const HistoryJoinedCard = ({ item, index }: { item: Quiz; index: number }) => {
  return (
    <h1>UWU {index} - {item.toString()}</h1>
  );
};

export default HistoryJoinedCard