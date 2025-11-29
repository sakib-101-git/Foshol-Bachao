import { useState, useRef, useEffect } from 'react';
import { getLanguage, getBatches } from '../utils/localSync';
import { weather } from '../utils/api';

/**
 * B4: Bangla Voice/Touchless Interface
 * Voice recognition with chat interface
 */

const API_BASE = import.meta.env.PROD
  ? import.meta.env.VITE_API_BASE
  : 'http://localhost:3001/api';

function VoiceChat({ lang = 'bn', onClose }) {
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [useTextMode, setUseTextMode] = useState(false);
  const [error, setError] = useState(null);
  
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const chatEndRef = useRef(null);
  const audioRef = useRef(null);
  
  const batches = getBatches();
  
  useEffect(() => {
    // Add welcome message
    setMessages([{
      type: 'bot',
      text: lang === 'bn' 
        ? '👋 নমস্কার! আমি আপনার সহায়ক। আপনি কথা বলতে পারেন বা টাইপ করতে পারেন।'
        : '👋 Hello! I am your assistant. You can speak or type.',
      timestamp: new Date()
    }]);
  }, [lang]);
  
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);
  
  const startRecording = async () => {
    try {
      setError(null);
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          sampleRate: 16000,
          channelCount: 1,
          echoCancellation: true,
          noiseSuppression: true
        } 
      });
      
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm;codecs=opus'
      });
      
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];
      
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };
      
      mediaRecorder.onstop = async () => {
        stream.getTracks().forEach(track => track.stop());
        await processAudio();
      };
      
      mediaRecorder.start();
      setIsRecording(true);
      
      // Auto-stop after 5 seconds
      setTimeout(() => {
        if (isRecording) {
          stopRecording();
        }
      }, 5000);
      
    } catch (err) {
      console.error('Microphone access error:', err);
      setError(lang === 'bn' 
        ? 'মাইক্রোফোন অ্যাক্সেস পাওয়া যায়নি। টেক্সট মোড ব্যবহার করুন।'
        : 'Microphone access denied. Please use text mode.');
      setUseTextMode(true);
    }
  };
  
  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };
  
  const processAudio = async () => {
    setIsProcessing(true);
    
    try {
      const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
      
      // Add user message (voice)
      const userMessage = {
        type: 'user',
        text: lang === 'bn' ? '🎤 কথা বলা হয়েছে...' : '🎤 Speaking...',
        isVoice: true,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, userMessage]);
      
      // Send to backend
      const formData = new FormData();
      formData.append('audio', audioBlob, 'recording.webm');
      formData.append('lang', lang);
      
      const response = await fetch(`${API_BASE}/voice/process`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('harvestguard_token') || 'demo-token-auto-login'}`
        },
        body: formData
      });
      
      if (!response.ok) {
        throw new Error('Voice processing failed');
      }
      
      const data = await response.json();
      
      // Update user message with transcription
      setMessages(prev => prev.map((msg, idx) => 
        idx === prev.length - 1 && msg.isVoice
          ? { ...msg, text: data.transcription || userMessage.text }
          : msg
      ));
      
      // Add bot response
      const botMessage = {
        type: 'bot',
        text: data.reply,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, botMessage]);
      
      // Play audio if available
      if (data.audioUrl) {
        playAudio(data.audioUrl);
      }
      
    } catch (err) {
      console.error('Voice processing error:', err);
      setError(lang === 'bn' 
        ? 'ভয়েস প্রক্রিয়াকরণ ব্যর্থ। টেক্সট মোড ব্যবহার করুন।'
        : 'Voice processing failed. Please use text mode.');
      setUseTextMode(true);
    } finally {
      setIsProcessing(false);
    }
  };
  
  const handleTextSubmit = async (e) => {
    e.preventDefault();
    if (!inputText.trim()) return;
    
    const userText = inputText.trim();
    setInputText('');
    setIsProcessing(true);
    
    // Add user message
    const userMessage = {
      type: 'user',
      text: userText,
      timestamp: new Date()
    };
    setMessages(prev => [...prev, userMessage]);
    
    try {
      const response = await fetch(`${API_BASE}/voice/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('harvestguard_token') || 'demo-token-auto-login'}`
        },
        body: JSON.stringify({
          text: userText,
          lang: lang,
          batches: batches
        })
      });
      
      if (!response.ok) {
        throw new Error('Chat failed');
      }
      
      const data = await response.json();
      
      // Add bot response
      const botMessage = {
        type: 'bot',
        text: data.reply,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, botMessage]);
      
      // Play audio if available
      if (data.audioUrl) {
        playAudio(data.audioUrl);
      }
      
    } catch (err) {
      console.error('Chat error:', err);
      setError(lang === 'bn' 
        ? 'চ্যাট ব্যর্থ হয়েছে। আবার চেষ্টা করুন।'
        : 'Chat failed. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };
  
  const playAudio = (audioUrl) => {
    if (audioRef.current) {
      audioRef.current.src = audioUrl;
      audioRef.current.play().catch(err => {
        console.error('Audio play error:', err);
      });
    }
  };
  
  return (
    <div style={styles.container}>
      {/* Header */}
      <div style={styles.header}>
        <h3 style={styles.title}>
          {lang === 'bn' ? '🎤 ভয়েস সহায়ক' : '🎤 Voice Assistant'}
        </h3>
        <button onClick={onClose} style={styles.closeButton}>
          ✕
        </button>
      </div>
      
      {/* Error Message */}
      {error && (
        <div style={styles.errorCard}>
          <span>⚠️</span>
          <span>{error}</span>
        </div>
      )}
      
      {/* Messages */}
      <div style={styles.messagesContainer}>
        {messages.map((msg, idx) => (
          <div
            key={idx}
            style={{
              ...styles.message,
              ...(msg.type === 'user' ? styles.userMessage : styles.botMessage)
            }}
          >
            <div style={styles.messageContent}>
              {msg.type === 'bot' && <span style={styles.botIcon}>🤖</span>}
              <span style={styles.messageText}>{msg.text}</span>
            </div>
            <span style={styles.timestamp}>
              {msg.timestamp.toLocaleTimeString('bn-BD', {
                hour: '2-digit',
                minute: '2-digit'
              })}
            </span>
          </div>
        ))}
        {isProcessing && (
          <div style={styles.typingIndicator}>
            <span>🤖</span>
            <div style={styles.typingDots}>
              <span></span>
              <span></span>
              <span></span>
            </div>
          </div>
        )}
        <div ref={chatEndRef} />
      </div>
      
      {/* Voice Recording */}
      {!useTextMode && (
        <div style={styles.voiceControls}>
          <button
            style={{
              ...styles.recordButton,
              ...(isRecording ? styles.recordButtonActive : {})
            }}
            onMouseDown={startRecording}
            onMouseUp={stopRecording}
            onTouchStart={startRecording}
            onTouchEnd={stopRecording}
            disabled={isProcessing}
          >
            {isRecording ? '⏹️' : '🎤'}
            <span style={styles.recordText}>
              {isRecording 
                ? (lang === 'bn' ? 'কথা বলুন...' : 'Speaking...')
                : (lang === 'bn' ? 'চাপে ধরে কথা বলুন' : 'Hold to Speak')}
            </span>
          </button>
          <button
            onClick={() => setUseTextMode(true)}
            style={styles.textModeButton}
          >
            {lang === 'bn' ? '⌨️ টেক্সট মোড' : '⌨️ Text Mode'}
          </button>
        </div>
      )}
      
      {/* Text Input */}
      {useTextMode && (
        <form onSubmit={handleTextSubmit} style={styles.textInputContainer}>
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder={lang === 'bn' ? 'আপনার প্রশ্ন লিখুন...' : 'Type your question...'}
            style={styles.textInput}
            disabled={isProcessing}
          />
          <button
            type="submit"
            style={styles.sendButton}
            disabled={isProcessing || !inputText.trim()}
          >
            ➤
          </button>
          <button
            type="button"
            onClick={() => setUseTextMode(false)}
            style={styles.voiceModeButton}
          >
            🎤
          </button>
        </form>
      )}
      
      {/* Hidden Audio Player */}
      <audio ref={audioRef} style={{ display: 'none' }} />
    </div>
  );
}

const styles = {
  container: {
    position: 'fixed',
    bottom: '20px',
    right: '20px',
    width: '400px',
    maxHeight: '600px',
    background: '#ffffff',
    borderRadius: '16px',
    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.2)',
    display: 'flex',
    flexDirection: 'column',
    zIndex: 10000,
    border: '2px solid #1a3d1a'
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '16px',
    background: 'linear-gradient(135deg, #1a3d1a 0%, #2d5a27 100%)',
    borderRadius: '14px 14px 0 0',
    borderBottom: '2px solid #c9a227'
  },
  title: {
    fontSize: '1.1rem',
    fontWeight: '700',
    color: '#ffffff',
    margin: 0
  },
  closeButton: {
    background: 'transparent',
    border: 'none',
    color: '#ffffff',
    fontSize: '1.5rem',
    cursor: 'pointer',
    padding: '0',
    width: '30px',
    height: '30px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  },
  errorCard: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '12px 16px',
    background: '#fef2f2',
    color: '#dc2626',
    fontSize: '0.85rem',
    borderBottom: '1px solid #fecaca'
  },
  messagesContainer: {
    flex: 1,
    overflowY: 'auto',
    padding: '16px',
    maxHeight: '400px',
    background: '#f9fafb'
  },
  message: {
    marginBottom: '12px',
    animation: 'fadeIn 0.3s ease'
  },
  userMessage: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-end'
  },
  botMessage: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-start'
  },
  messageContent: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '10px 14px',
    borderRadius: '12px',
    maxWidth: '80%'
  },
  userMessageContent: {
    background: 'linear-gradient(135deg, #1a3d1a 0%, #2d5a27 100%)',
    color: '#ffffff'
  },
  botMessageContent: {
    background: '#ffffff',
    color: '#1f2937',
    border: '1px solid #e5e7eb'
  },
  botIcon: {
    fontSize: '1.2rem'
  },
  messageText: {
    fontSize: '0.95rem',
    lineHeight: '1.5'
  },
  timestamp: {
    fontSize: '0.7rem',
    color: '#6b7280',
    marginTop: '4px',
    padding: '0 4px'
  },
  typingIndicator: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '10px 14px',
    background: '#ffffff',
    borderRadius: '12px',
    border: '1px solid #e5e7eb',
    width: 'fit-content'
  },
  typingDots: {
    display: 'flex',
    gap: '4px'
  },
  typingDots: {
    display: 'flex',
    gap: '4px'
  },
  'typingDots span': {
    width: '8px',
    height: '8px',
    background: '#1a3d1a',
    borderRadius: '50%',
    animation: 'bounce 1.4s infinite'
  },
  voiceControls: {
    padding: '16px',
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
    background: '#ffffff',
    borderTop: '1px solid #e5e7eb'
  },
  recordButton: {
    width: '100%',
    padding: '16px',
    background: 'linear-gradient(135deg, #1a3d1a 0%, #2d5a27 100%)',
    color: '#ffffff',
    border: 'none',
    borderRadius: '12px',
    fontSize: '1.2rem',
    fontWeight: '700',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '10px',
    transition: 'all 0.2s ease'
  },
  recordButtonActive: {
    background: 'linear-gradient(135deg, #dc2626 0%, #ea580c 100%)',
    transform: 'scale(1.05)',
    boxShadow: '0 4px 12px rgba(220, 38, 38, 0.4)'
  },
  recordText: {
    fontSize: '0.95rem'
  },
  textModeButton: {
    padding: '10px',
    background: '#f3f4f6',
    color: '#374151',
    border: '1px solid #d1d5db',
    borderRadius: '8px',
    fontSize: '0.9rem',
    cursor: 'pointer',
    fontWeight: '600'
  },
  textInputContainer: {
    display: 'flex',
    gap: '8px',
    padding: '16px',
    background: '#ffffff',
    borderTop: '1px solid #e5e7eb'
  },
  textInput: {
    flex: 1,
    padding: '12px 16px',
    border: '2px solid #d1d5db',
    borderRadius: '10px',
    fontSize: '0.95rem',
    fontFamily: 'inherit',
    outline: 'none'
  },
  sendButton: {
    padding: '12px 20px',
    background: 'linear-gradient(135deg, #1a3d1a 0%, #2d5a27 100%)',
    color: '#ffffff',
    border: 'none',
    borderRadius: '10px',
    fontSize: '1.2rem',
    cursor: 'pointer',
    fontWeight: '700'
  },
  voiceModeButton: {
    padding: '12px 16px',
    background: '#f3f4f6',
    color: '#374151',
    border: '1px solid #d1d5db',
    borderRadius: '10px',
    fontSize: '1.2rem',
    cursor: 'pointer'
  }
};

// Add CSS animations
if (typeof document !== 'undefined') {
  const styleSheet = document.createElement('style');
  styleSheet.textContent = `
    @keyframes fadeIn {
      from { opacity: 0; transform: translateY(10px); }
      to { opacity: 1; transform: translateY(0); }
    }
    @keyframes bounce {
      0%, 80%, 100% { transform: translateY(0); }
      40% { transform: translateY(-10px); }
    }
  `;
  if (!document.getElementById('voice-chat-styles')) {
    styleSheet.id = 'voice-chat-styles';
    document.head.appendChild(styleSheet);
  }
}

export default VoiceChat;

