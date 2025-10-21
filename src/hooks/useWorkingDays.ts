import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface Holiday {
  date: string;
}

export const useWorkingDays = (startDate: string, endDate: string) => {
  const [workingDays, setWorkingDays] = useState(0);
  const [holidays, setHolidays] = useState<Holiday[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchHolidays();
  }, []);

  useEffect(() => {
    if (startDate && endDate && holidays.length >= 0) {
      calculateWorkingDays();
    }
  }, [startDate, endDate, holidays]);

  const fetchHolidays = async () => {
    const { data } = await supabase
      .from('holidays' as any)
      .select('date');
    
    setHolidays((data as any) || []);
  };

  const calculateWorkingDays = () => {
    if (!startDate || !endDate) {
      setWorkingDays(0);
      return;
    }

    const start = new Date(startDate);
    const end = new Date(endDate);
    
    if (start > end) {
      setWorkingDays(0);
      return;
    }

    let count = 0;
    const current = new Date(start);
    const holidayDates = new Set(holidays.map(h => h.date));

    while (current <= end) {
      const dayOfWeek = current.getDay();
      const dateStr = current.toISOString().split('T')[0];
      
      // Not weekend (0 = Sunday, 6 = Saturday) and not holiday
      if (dayOfWeek !== 0 && dayOfWeek !== 6 && !holidayDates.has(dateStr)) {
        count++;
      }
      
      current.setDate(current.getDate() + 1);
    }

    setWorkingDays(count);
  };

  return { workingDays, loading };
};
