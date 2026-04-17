import { useState, useEffect, useRef } from 'react';

/**
 * Custom hook to handle the quiz timer logic.
 * @param {number} initialSeconds - Initial time in seconds.
 * @param {function} onTimeUp - Callback function when time runs out.
 * @param {boolean} active - Whether the timer is currently running.
 */
export function useQuizTimer(initialSeconds, onTimeUp, active = false) {
  const [timeLeft, setTimeLeft] = useState(initialSeconds);
  const [isActive, setIsActive] = useState(active);
  const onTimeUpRef = useRef(onTimeUp);

  useEffect(() => {
    onTimeUpRef.current = onTimeUp;
  }, [onTimeUp]);

  useEffect(() => {
    setIsActive(active);
  }, [active]);

  useEffect(() => {
    if (!isActive) return;

    if (timeLeft <= 0) {
      onTimeUpRef.current?.();
      setIsActive(false);
      return;
    }

    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          onTimeUpRef.current?.();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isActive, timeLeft]);

  const resetTimer = (newSeconds) => {
    setTimeLeft(newSeconds || initialSeconds);
    setIsActive(true);
  };

  const stopTimer = () => {
    setIsActive(false);
  };

  return {
    timeLeft,
    isActive,
    resetTimer,
    stopTimer,
    setTimeLeft
  };
}
