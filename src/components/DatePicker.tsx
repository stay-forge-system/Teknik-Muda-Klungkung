'use client';

import {
  DatePicker as AriaDatePicker,
  Button,
  Calendar,
  CalendarCell,
  CalendarGrid,
  CalendarGridBody,
  CalendarGridHeader,
  CalendarHeaderCell,
  DateInput,
  DateSegment,
  Dialog,
  Group,
  Heading,
  Popover,
} from 'react-aria-components';
import { CalendarDate, parseDate } from '@internationalized/date';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight } from 'lucide-react';

interface Props {
  value?: string;
  onChange?: (dateStr: string) => void;
  className?: string;
  disabled?: boolean;
}

export function CustomDatePicker({ value, onChange, className, disabled }: Props) {
  // Convert YYYY-MM-DD string to CalendarDate for react-aria
  const ariaValue = value ? parseDate(value) : null;

  const handleChange = (date: CalendarDate | null) => {
    if (onChange && date) {
      onChange(date.toString());
    }
  };

  return (
    <AriaDatePicker
      value={ariaValue as any}
      onChange={handleChange as any}
      isDisabled={disabled}
      className={`rac-date-picker ${className || ''}`}
    >
      <Group className="rac-group">
        <DateInput className="rac-date-input">
          {(segment) => <DateSegment segment={segment} className="rac-segment" />}
        </DateInput>
        <Button className="rac-button-calendar">
          <CalendarIcon size={16} />
        </Button>
      </Group>
      
      <Popover className="rac-popover" placement="bottom start" offset={8}>
        <Dialog className="rac-dialog">
          <Calendar className="rac-calendar">
            <header className="rac-calendar-header">
              <Button slot="previous" className="rac-calendar-nav"><ChevronLeft size={16} /></Button>
              <Heading className="rac-calendar-title" />
              <Button slot="next" className="rac-calendar-nav"><ChevronRight size={16} /></Button>
            </header>
            <CalendarGrid className="rac-calendar-grid">
              <CalendarGridHeader>
                {(day) => <CalendarHeaderCell className="rac-calendar-header-cell">{day}</CalendarHeaderCell>}
              </CalendarGridHeader>
              <CalendarGridBody>
                {(date) => <CalendarCell date={date} className="rac-calendar-cell" />}
              </CalendarGridBody>
            </CalendarGrid>
          </Calendar>
        </Dialog>
      </Popover>
    </AriaDatePicker>
  );
}
