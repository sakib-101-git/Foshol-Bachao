import { useState, useRef } from 'react';
import { API_BASE } from '../utils/api';

function VoiceButton({ lang = 'bn' }) {
  const [open, setOpen] = useState(false);
  const [recording, setRecording] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [reply, setReply] = useState(null);
  const mediaRecorderRef = useRef(null);
  const chunksRef = useRef([]);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mr = new MediaRecorder(stream);
      mediaRecorderRef.current = mr;
      chunksRef.current = [];

      mr.ondataavailable = (e) => {
        if (e.data && e.data.size) chunksRef.current.push(e.data);
      };

      mr.onstop = async () => {
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
        // Send to backend /api/voice/process as form data
        const fd = new FormData();
        fd.append('audio', blob, 'voice.webm');
        try {
          const resp = await fetch(`${API_BASE}/voice/process`, { method: 'POST', body: fd });
          const data = await resp.json();
          setTranscript(data.transcription || '');
          setReply(data.reply || null);
        } catch (err) {
          console.error('Voice processing failed', err);
          setReply(lang === 'bn' ? 'ভয়েস প্রক্রিয়াকরণ ব্যর্থ' : 'Voice processing failed');
        }
      };

      mr.start();
      setRecording(true);
    } catch (err) {
      console.error('Could not start recording', err);
      alert(lang === 'bn' ? 'মাইক্রোফোন অ্যাক্সেস প্রয়োজন' : 'Microphone access required');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
      setRecording(false);
    }
  };

  return (
    <>
      <div style={styles.wrapper}>
        <button
          aria-label="Voice Assistant"
          title={lang === 'bn' ? 'ভয়েস সহকারী' : 'Voice Assistant'}
          onClick={() => setOpen(!open)}
          style={styles.micButton}
        >
          🎤
        </button>
      </div>

      {open && (
        <div style={styles.modalBackdrop} onClick={() => setOpen(false)}>
          <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
            <h4 style={{ marginTop: 0 }}>{lang === 'bn' ? 'ভয়েস চ্যাট' : 'Voice Chat'}</h4>
            <div style={styles.controls}>
              <button onClick={recording ? stopRecording : startRecording} style={styles.recordBtn}>
                {recording ? (lang === 'bn' ? 'রেকর্ড বন্ধ' : 'Stop') : (lang === 'bn' ? 'রেকর্ড শুরু' : 'Record')}
              </button>
            </div>

            <div style={styles.box}>
              <strong>{lang === 'bn' ? 'ট্রান্সক্রিপশন:' : 'Transcription:'}</strong>
              <div style={styles.text}>{transcript || (lang === 'bn' ? 'কোনও ট্রান্সক্রিপশন নেই' : 'No transcription yet')}</div>
              <strong style={{ marginTop: 8 }}>{lang === 'bn' ? 'এআই উত্তর:' : 'AI Reply:'}</strong>
              <div style={styles.text}>{reply || (lang === 'bn' ? 'কোনও উত্তর নেই' : 'No reply yet')}</div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

const styles = {
  wrapper: {
    position: 'fixed',
    right: 20,
    bottom: 24,
    zIndex: 9999
  },
  micButton: {
    width: 56,
    height: 56,
    borderRadius: '50%',
    background: '#0ea5e9',
    color: 'white',
    border: 'none',
    fontSize: '1.5rem',
    boxShadow: '0 6px 18px rgba(14,165,233,0.25)',
    cursor: 'pointer'
  },
  modalBackdrop: {
    position: 'fixed',
    inset: 0,
    background: 'rgba(0,0,0,0.3)',
    display: 'flex',
    justifyContent: 'flex-end',
    alignItems: 'flex-end',
    padding: 20,
    zIndex: 10000
  },
  modal: {
    width: 360,
    maxWidth: 'calc(100% - 40px)',
    background: '#fff',
    borderRadius: 12,
    padding: 12,
    boxShadow: '0 8px 30px rgba(0,0,0,0.2)'
  },
  controls: { display: 'flex', gap: 8, marginBottom: 8 },
  recordBtn: { padding: '8px 12px', background: '#ef4444', color: 'white', border: 'none', borderRadius: 8, cursor: 'pointer' },
  box: { marginTop: 8, background: '#f9fafb', padding: 8, borderRadius: 6, minHeight: 80 },
  text: { marginTop: 6, fontSize: '0.95rem' }
};

export default VoiceButton;
