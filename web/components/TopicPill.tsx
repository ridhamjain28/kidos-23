interface Props {
  emoji: string;
  label: string;
  value: string;
  active: boolean;
  onClick: () => void;
}

export default function TopicPill({ emoji, label, value, active, onClick }: Props) {
  return (
    <button
      id={`topic-pill-${value}`}
      onClick={onClick}
      className={`flex items-center gap-1.5 px-4 py-2 rounded-full font-bold text-sm transition-all duration-200 ${
        active
          ? 'bg-kidos-purple text-white shadow-kid scale-105'
          : 'bg-white border border-purple-200 text-kidos-purple hover:bg-purple-50'
      }`}
    >
      <span>{emoji}</span>
      <span>{label}</span>
    </button>
  );
}
