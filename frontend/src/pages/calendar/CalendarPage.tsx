import { useEffect, useState } from 'react';
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Clock,
  MapPin,
  Sparkles,
  Heart,
  Shirt,
  Tag,
  Filter,
  Users,
  Camera,
} from 'lucide-react';
import { eventApi, fashionBookingApi, projectApi } from '../../services/api';
import { formatDate } from '../../lib/utils';
import StatusBadge from '../../components/ui/StatusBadge';

type CalendarFilter = 'ALL' | 'WEDDING' | 'FASHION';

export default function CalendarPage() {
  const [filter, setFilter] = useState<CalendarFilter>('ALL');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [events, setEvents] = useState<any[]>([]);
  const [bookings, setBookings] = useState<any[]>([]);
  const [projects, setProjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDayEvents, setSelectedDayEvents] = useState<any[]>([]);
  const [selectedDateStr, setSelectedDateStr] = useState<string>('');

  const loadAll = async () => {
    try {
      setLoading(true);
      const [evtRes, bkgRes, prjRes] = await Promise.all([
        eventApi.getAll(),
        fashionBookingApi.getAll(),
        projectApi.getAll(),
      ]);
      setEvents(evtRes.data.data || []);
      setBookings(bkgRes.data.data || []);
      setProjects(prjRes.data.data || []);
    } catch (err) {
      console.error('Failed to load calendar data', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAll();
  }, []);

  // Standardize items into CalendarItems
  const calendarItems: any[] = [];

  if (filter === 'ALL' || filter === 'WEDDING') {
    events.forEach((evt) => {
      const date = evt.startDate ? new Date(evt.startDate) : null;
      if (date && !isNaN(date.getTime())) {
        calendarItems.push({
          id: `evt-${evt.id}`,
          title: evt.eventName,
          date: date,
          dateKey: date.toISOString().slice(0, 10),
          type: 'WEDDING',
          subType: evt.eventType?.replace(/_/g, ' '),
          location: evt.venue || evt.city || 'Venue',
          client: evt.customer?.fullName,
          status: evt.status,
          raw: evt,
        });
      }
    });
  }

  if (filter === 'ALL' || filter === 'FASHION') {
    bookings.forEach((bkg) => {
      const date = bkg.date ? new Date(bkg.date) : null;
      if (date && !isNaN(date.getTime())) {
        calendarItems.push({
          id: `bkg-${bkg.id}`,
          title: `${bkg.bayName} - ${bkg.customer?.fullName || 'Client Shoot'}`,
          date: date,
          dateKey: date.toISOString().slice(0, 10),
          type: 'FASHION',
          subType: `${bkg.startTime || ''} - ${bkg.endTime || ''}`,
          location: `Bay: ${bkg.bayName}`,
          client: bkg.customer?.fullName,
          status: bkg.status,
          raw: bkg,
        });
      }
    });
  }

  // Month navigation
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth(); // 0-indexed

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December',
  ];

  const firstDayOfMonth = new Date(year, month, 1).getDay(); // 0 is Sunday
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const prevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  const today = () => {
    setCurrentDate(new Date());
  };

  // Build grid days
  const calendarCells: { day: number | null; dateKey: string | null; items: any[] }[] = [];

  // Padding for leading empty days
  for (let i = 0; i < firstDayOfMonth; i++) {
    calendarCells.push({ day: null, dateKey: null, items: [] });
  }

  // Actual month days
  for (let d = 1; d <= daysInMonth; d++) {
    const dStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    const dayItems = calendarItems.filter((item) => item.dateKey === dStr);
    calendarCells.push({
      day: d,
      dateKey: dStr,
      items: dayItems,
    });
  }

  const handleCellClick = (cell: { day: number | null; dateKey: string | null; items: any[] }) => {
    if (!cell.day || !cell.dateKey) return;
    setSelectedDateStr(cell.dateKey);
    setSelectedDayEvents(cell.items);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-gray-900">
              Studio Master Calendar
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#FAF5EB] text-[#9A7318] border border-[#C59B27]/30">
              Shoots & Bookings
            </span>
          </div>
          <p className="text-sm text-gray-500 mt-0.5">
            Unified schedule for Wedding ceremonies, fashion studio bays & creative assignments
          </p>
        </div>

        {/* Domain Filter */}
        <div className="flex items-center gap-2 bg-white p-1 rounded-xl border border-gray-200 shadow-sm">
          <button
            onClick={() => setFilter('ALL')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              filter === 'ALL'
                ? 'bg-gray-900 text-white shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            All Shoots ({calendarItems.length})
          </button>
          <button
            onClick={() => setFilter('WEDDING')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
              filter === 'WEDDING'
                ? 'bg-amber-500 text-white shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <Heart className="w-3.5 h-3.5" /> Wedding Shoots
          </button>
          <button
            onClick={() => setFilter('FASHION')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
              filter === 'FASHION'
                ? 'bg-purple-600 text-white shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <Shirt className="w-3.5 h-3.5" /> Studio Fashion
          </button>
        </div>
      </div>

      {/* Calendar Bar & Navigation */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <h2 className="text-lg font-bold text-gray-900">
            {monthNames[month]} {year}
          </h2>
          <div className="flex items-center gap-1 bg-gray-50 rounded-lg p-1 border border-gray-200">
            <button
              onClick={prevMonth}
              className="p-1 rounded hover:bg-gray-200 text-gray-600"
              title="Previous Month"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={today}
              className="px-2 py-0.5 text-xs font-semibold text-gray-700 hover:bg-gray-200 rounded"
            >
              Today
            </button>
            <button
              onClick={nextMonth}
              className="p-1 rounded hover:bg-gray-200 text-gray-600"
              title="Next Month"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Legend */}
        <div className="flex items-center gap-4 text-xs font-medium text-gray-500">
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500 inline-block" /> Wedding Event
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-purple-600 inline-block" /> Studio Bay Booking
          </span>
        </div>
      </div>

      {/* Month Grid */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        {/* Days Header */}
        <div className="grid grid-cols-7 border-b border-gray-200 bg-gray-50/70 text-center text-xs font-semibold text-gray-600 py-2.5">
          <div>Sun</div>
          <div>Mon</div>
          <div>Tue</div>
          <div>Wed</div>
          <div>Thu</div>
          <div>Fri</div>
          <div>Sat</div>
        </div>

        {/* Cells */}
        <div className="grid grid-cols-7 divide-x divide-y divide-gray-100 min-h-[500px]">
          {calendarCells.map((cell, idx) => {
            const isToday =
              cell.dateKey === new Date().toISOString().slice(0, 10);
            const isSelected = cell.dateKey === selectedDateStr;

            return (
              <div
                key={idx}
                onClick={() => handleCellClick(cell)}
                className={`p-2 min-h-[95px] flex flex-col justify-between transition-colors cursor-pointer ${
                  !cell.day ? 'bg-gray-50/40 cursor-default' : 'hover:bg-amber-50/30'
                } ${isSelected ? 'bg-[#FAF5EB] ring-2 ring-[#C59B27] inset-0 z-10' : ''}`}
              >
                {cell.day ? (
                  <>
                    <div className="flex items-center justify-between">
                      <span
                        className={`text-xs font-bold w-6 h-6 flex items-center justify-center rounded-full ${
                          isToday
                            ? 'bg-[#C59B27] text-white'
                            : 'text-gray-700'
                        }`}
                      >
                        {cell.day}
                      </span>
                      {cell.items.length > 0 && (
                        <span className="text-[10px] font-semibold text-gray-400">
                          {cell.items.length}
                        </span>
                      )}
                    </div>

                    {/* Small Event badges */}
                    <div className="mt-1.5 space-y-1 overflow-hidden">
                      {cell.items.slice(0, 3).map((item) => (
                        <div
                          key={item.id}
                          className={`text-[10px] font-medium px-1.5 py-0.5 rounded truncate border ${
                            item.type === 'WEDDING'
                              ? 'bg-amber-50 text-amber-800 border-amber-200/70'
                              : 'bg-purple-50 text-purple-800 border-purple-200/70'
                          }`}
                          title={`${item.title} (${item.subType})`}
                        >
                          {item.title}
                        </div>
                      ))}
                      {cell.items.length > 3 && (
                        <span className="text-[9px] text-gray-500 font-semibold px-1">
                          +{cell.items.length - 3} more
                        </span>
                      )}
                    </div>
                  </>
                ) : null}
              </div>
            );
          })}
        </div>
      </div>

      {/* Selected Day Agenda View */}
      {selectedDateStr && (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 space-y-3 animate-in fade-in">
          <div className="flex items-center justify-between border-b border-gray-100 pb-2">
            <div className="flex items-center gap-2">
              <CalendarIcon className="w-4 h-4 text-[#C59B27]" />
              <h3 className="text-sm font-bold text-gray-900">
                Schedule for {formatDate(selectedDateStr)}
              </h3>
              <span className="text-xs text-gray-500 font-medium">
                ({selectedDayEvents.length} items)
              </span>
            </div>
            <button
              onClick={() => setSelectedDateStr('')}
              className="text-xs text-gray-400 hover:text-gray-600"
            >
              Close
            </button>
          </div>

          {selectedDayEvents.length === 0 ? (
            <p className="text-xs text-gray-400 py-3">No shoots or bookings scheduled for this date.</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {selectedDayEvents.map((item) => (
                <div
                  key={item.id}
                  className={`p-3 rounded-xl border flex flex-col justify-between ${
                    item.type === 'WEDDING'
                      ? 'bg-amber-50/40 border-amber-200'
                      : 'bg-purple-50/40 border-purple-200'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-1.5">
                        {item.type === 'WEDDING' ? (
                          <Heart className="w-3.5 h-3.5 text-amber-600" />
                        ) : (
                          <Shirt className="w-3.5 h-3.5 text-purple-600" />
                        )}
                        <span className="text-xs font-bold text-gray-900">{item.title}</span>
                      </div>
                      <p className="text-[11px] text-gray-500 mt-0.5">
                        Client: {item.client || 'N/A'} &bull; {item.subType}
                      </p>
                    </div>
                    <StatusBadge status={item.status} />
                  </div>
                  <div className="mt-2 pt-2 border-t border-gray-200/50 flex items-center justify-between text-[11px] text-gray-600">
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3 h-3 text-gray-400" /> {item.location}
                    </span>
                    <span className="font-semibold text-xs text-gray-700 uppercase">
                      {item.type}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
