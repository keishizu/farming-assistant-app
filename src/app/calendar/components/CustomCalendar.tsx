// components/CustomCalendar.tsx

import Calendar from 'react-calendar';
import type { CalendarProps } from 'react-calendar';
import { isHoliday } from '@holiday-jp/holiday_jp';
import 'react-calendar/dist/Calendar.css';

interface ExtendedCalendarProps extends Omit<CalendarProps, 'formatDay'> {
  formatDay?: (locale: string | undefined, date: Date) => string;
}

const CustomCalendar = ({ tileClassName, ...props }: ExtendedCalendarProps) => {
 const customTileClassName: CalendarProps['tileClassName'] = ({ date, view, activeStartDate }) => {
   if (view !== 'month') return null;
      
    const day = date.getDay();
    let classes = '';
    // 👇 土日判定
    if (day === 0) classes += ' sunday-red';
    if (day === 6) classes += ' saturday-blue';

    // 👇 祝日判定（@holiday-jp使用）
    if (isHoliday(date)) classes += ' holiday-red';
    
    // 👇 呼び出し元の tileClassName も反映
    if (typeof tileClassName === 'function') {
    const original = tileClassName({ date, view, activeStartDate });
    if (original) classes += ` ${original}`;
    } else if (typeof tileClassName === 'string') {
    classes += ` ${tileClassName}`;
    }
      
      return classes.trim();
    };
      
  return <Calendar {...props} tileClassName={customTileClassName} />;
};

export default CustomCalendar;
