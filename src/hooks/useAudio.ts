import { useState, useRef, useEffect } from 'react';
import { generateSpeech } from '../services/geminiService';

export function useAudio() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isAudioLoading, setIsAudioLoading] = useState(false);
  const [audioProgress, setAudioProgress] = useState(0);
  const [audioDuration, setAudioDuration] = useState(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const playAudio = async (text: string) => {
    if (isAudioLoading) return;

    if (audioRef.current && isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
      return;
    }

    if (audioRef.current && !isPlaying) {
      audioRef.current.play();
      setIsPlaying(true);
      return;
    }

    setIsAudioLoading(true);
    const url = await generateSpeech(text);
    setIsAudioLoading(false);

    if (url) {
      const audio = new Audio(url);
      audioRef.current = audio;
      
      audio.addEventListener('play', () => setIsPlaying(true));
      audio.addEventListener('pause', () => setIsPlaying(false));
      audio.addEventListener('ended', () => {
        setIsPlaying(false);
        setAudioProgress(0);
      });
      audio.addEventListener('timeupdate', () => setAudioProgress(audio.currentTime));
      audio.addEventListener('loadedmetadata', () => setAudioDuration(audio.duration));

      audio.play();
    }
  };

  const stopAudio = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
    setIsPlaying(false);
    setAudioProgress(0);
    setAudioDuration(0);
  };

  return {
    isPlaying,
    isAudioLoading,
    audioProgress,
    audioDuration,
    playAudio,
    stopAudio
  };
}
