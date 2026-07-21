type Props = {
  source: 'gpt' | 'local' | null;
  liveLabel: string;
};

export default function SourceBadge({ source, liveLabel }: Props) {
  if (!source) return null;

  if (source === 'gpt') {
    return <span className="source-tag gpt">GPT, {liveLabel}</span>;
  }

  return <span className="source-tag">Local engine</span>;
}
