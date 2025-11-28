import {useCallback, useMemo} from 'react';
import {useMediaContext} from '../context/MediaContext';

function formatCalendarDate(date) {
  // Calendar library expects YYYY-MM-DD string keys.
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, '0');
  const day = `${date.getDate()}`.padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function useCalendarMedia() {
  const {media, allMedia, selectedDate, setSelectedDate, loading, progress, refresh} = useMediaContext();

  const selectDate = useCallback(
    (date) => {
      setSelectedDate(date);
    },
    [setSelectedDate]
  );

  const clearDate = useCallback(() => setSelectedDate(null), [setSelectedDate]);

  const selectedCalendarKey = useMemo(
    () => (selectedDate ? formatCalendarDate(selectedDate) : undefined),
    [selectedDate]
  );

  const markedDates = useMemo(() => {
    if (!selectedCalendarKey) {
      return {};
    }
    return {
      [selectedCalendarKey]: {
        selected: true,
        selectedColor: '#10B981',
        selectedTextColor: '#0B1221'
      }
    };
  }, [selectedCalendarKey]);

  const syncLibrary = useCallback(
    async (dateOverride) => {
      return refresh(dateOverride ?? selectedDate ?? null);
    },
    [refresh, selectedDate],
  );

  return {
    media,
    allMedia,
    selectedDate,
    selectedCalendarKey,
    markedDates,
    loading,
    progress,
    selectDate,
    clearDate,
    syncLibrary
  };
}
