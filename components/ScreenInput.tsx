'use client';

import { useRef, useState } from 'react';
import { JurisdictionId } from '@/lib/types';

export type ClaimStage = 'pre-claim' | 'rejected' | 'time-running-out';

type Props = {
  jurisdiction: JurisdictionId;
  onJurisdictionChange: (j: JurisdictionId) => void;
  claimStage: ClaimStage;
  onClaimStageChange: (s: ClaimStage) => void;
  photoFile: File | null;
  onPhotoChange: (f: File | null) => void;
  narrativeText: string;
  onNarrativeChange: (t: string) => void;
  onSubmit: () => void;
  submitDisabled: boolean;
  error: string | null;
};

export default function ScreenInput({
  jurisdiction,
  onJurisdictionChange,
  claimStage,
  onClaimStageChange,
  photoFile,
  onPhotoChange,
  narrativeText,
  onNarrativeChange,
  onSubmit,
  submitDisabled,
  error,
}: Props) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const [isRecording, setIsRecording] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [recordError, setRecordError] = useState<string | null>(null);
  const [showDisclosure, setShowDisclosure] = useState(false);

  async function startRecording() {
    setRecordError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      chunksRef.current = [];
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };
      recorder.onstop = async () => {
        stream.getTracks().forEach((t) => t.stop());
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
        setIsTranscribing(true);
        try {
          const form = new FormData();
          form.append('audio', new File([blob], 'narrative.webm', { type: 'audio/webm' }));
          const res = await fetch('/api/transcribe', { method: 'POST', body: form });
          const data = await res.json();
          if (!res.ok) throw new Error(data.error || 'Transcription failed.');
          if (data.notice) {
            setRecordError(data.notice);
          } else {
            onNarrativeChange((narrativeText ? narrativeText + ' ' : '') + data.text);
          }
        } catch (err) {
          setRecordError(err instanceof Error ? err.message : 'Transcription failed.');
        } finally {
          setIsTranscribing(false);
        }
      };
      recorder.start();
      mediaRecorderRef.current = recorder;
      setIsRecording(true);
    } catch (err) {
      setRecordError('Microphone access denied or unavailable.');
    }
  }

  function stopRecording() {
    mediaRecorderRef.current?.stop();
    setIsRecording(false);
  }

  return (
    <div>
      <div className="kicker">Your evidence</div>
      <h1>Tell us what happened.</h1>
      <p className="lede">
        Use a document, your own account, or both. You will be able to check the information we
        read before we review it.
      </p>

      <div className="upload-grid">
        <button type="button" className="upload" onClick={() => fileInputRef.current?.click()}>
          <strong>{photoFile ? photoFile.name : 'Upload a document'}</strong>
          <span>{photoFile ? 'Tap to choose a different file' : 'Photo, scan, or screenshot'}</span>
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          style={{ display: 'none' }}
          onChange={(e) => onPhotoChange(e.target.files?.[0] ?? null)}
        />
        <button type="button" className="upload" onClick={isRecording ? stopRecording : startRecording}>
          <strong>
            {isRecording ? 'Stop recording' : isTranscribing ? 'Transcribing…' : 'Record your account'}
          </strong>
          <span>Tell us what happened aloud</span>
        </button>
      </div>
      {photoFile && (
        <img
          className="thumb"
          style={{ marginTop: 12 }}
          src={URL.createObjectURL(photoFile)}
          alt="Uploaded document preview"
        />
      )}
      {recordError && <div className="error-block">{recordError}</div>}

      <label className="field-label">Your account</label>
      <textarea
        value={narrativeText}
        onChange={(e) => onNarrativeChange(e.target.value)}
        placeholder="Tell us what happened, in your own words."
      />

      <label className="field-label">Where is your policy based?</label>
      {(
        [
          { id: 'US_CA' as JurisdictionId, label: 'United States, California', detail: 'California claim-handling framework' },
          { id: 'IN' as JurisdictionId, label: 'India', detail: 'IRDAI claim-settlement regulations' },
          { id: 'EU_DE' as JurisdictionId, label: 'Germany', detail: 'German insurance contract framework' },
        ]
      ).map((opt) => (
        <label className="option" key={opt.id}>
          <input
            type="radio"
            name="jurisdiction"
            checked={jurisdiction === opt.id}
            onChange={() => onJurisdictionChange(opt.id)}
          />
          <div>
            <strong>{opt.label}</strong>
            <span>{opt.detail}</span>
          </div>
        </label>
      ))}

      <label className="field-label">What best describes your situation?</label>
      <label className="option">
        <input
          type="radio"
          name="stage"
          checked={claimStage === 'pre-claim'}
          onChange={() => onClaimStageChange('pre-claim')}
        />
        <div>
          <strong>I have not filed yet</strong>
        </div>
      </label>
      <label className="option">
        <input
          type="radio"
          name="stage"
          checked={claimStage === 'rejected'}
          onChange={() => onClaimStageChange('rejected')}
        />
        <div>
          <strong>My claim was rejected, delayed, or underpaid</strong>
        </div>
      </label>
      <label className="option">
        <input
          type="radio"
          name="stage"
          checked={claimStage === 'time-running-out'}
          onChange={() => onClaimStageChange('time-running-out')}
        />
        <div>
          <strong>I am running out of time to respond</strong>
          <span>Not yet active in this build</span>
        </div>
      </label>

      <div style={{ marginTop: 26 }}>
        <button type="button" className="text-link" onClick={() => setShowDisclosure((s) => !s)}>
          {showDisclosure ? 'Hide how this review is produced' : 'How this review is produced'}
        </button>
        {showDisclosure && (
          <div className="disclosure" style={{ marginTop: 12 }}>
            <div className="disclosure-row">
              <span className="disclosure-tag">LOCAL</span>
              Reads your document with on-device OCR, then pulls out the insurer, the dates, and
              the reason given with pattern matching, no API call involved.
            </div>
            <div className="disclosure-row">
              <span className="disclosure-tag">CODEX</span>
              Writes the check that runs against your jurisdiction&apos;s regulation, computed
              fresh for your case. You can open and read this code on the review step.
            </div>
            <div className="disclosure-row">
              <span className="disclosure-tag">LOCAL</span>
              Grounds every citation in the actual statutory text, retrieved from a small index
              built over the real regulation, not a paraphrase.
            </div>
            <div className="disclosure-row">
              <span className="disclosure-tag">GPT</span>
              Optional upgrade, only used if an OpenAI key is configured: sharper document
              reading, narrative understanding, and complaint prose on top of the same checks.
            </div>
            <div className="muted" style={{ marginTop: 4, fontSize: 12.5 }}>
              The local path is what runs by default and what every screen shows unless it&apos;s
              tagged GPT. Nothing here is a placeholder waiting on credits, it&apos;s the real
              engine.
            </div>
          </div>
        )}
      </div>

      {error && <div className="error-block">{error}</div>}

      <div className="actions">
        <span />
        <button
          type="button"
          className="btn primary"
          disabled={submitDisabled || claimStage === 'time-running-out'}
          onClick={onSubmit}
        >
          Continue
        </button>
      </div>
      {claimStage === 'time-running-out' && (
        <div className="muted" style={{ marginTop: 8, fontSize: 13 }}>
          This stage isn&apos;t active yet, choose one of the other two to continue.
        </div>
      )}
    </div>
  );
}
