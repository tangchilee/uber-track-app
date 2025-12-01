import React, { useState, useEffect, useMemo, useCallback, memo } from "react";
import {
  Plus,
  Calendar,
  Settings,
  Bike,
  Trash2,
  Wallet,
  Activity,
  X,
  CloudLightning,
  RefreshCw,
  DownloadCloud,
  ChevronLeft,
  ChevronRight,
  BarChart3,
  PieChart,
  Clock,
  TrendingUp,
  ArrowLeft,
  Home,
  DollarSign,
  List,
  Grid3X3,
  LineChart,
  Sun,
  CloudSun,
  Palmtree,
  Hourglass,
} from "lucide-react";

// ==========================================
// 1. CONFIGURATION
// ==========================================
const FIXED_SHEET_URL =
  "https://script.google.com/macros/s/AKfycbw62uZNkDNfzTXLQ2Gtz2cdX4O2U6z2Dhz-1oYKuMS8qOap7yuQkLe18luW5afY8lo0Hg/exec";

// ==========================================
// 2. UTILITY FUNCTIONS
// ==========================================
const getLocalDateString = (dateInput) => {
  try {
    const d = new Date(dateInput);
    if (isNaN(d.getTime())) return "";
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  } catch (e) {
    return "";
  }
};

const getWeekNumber = (d) => {
  try {
    d = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
    d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7));
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    return Math.ceil(((d - yearStart) / 86400000 + 1) / 7);
  } catch (e) {
    return 0;
  }
};

const formatDuration = (decimalHours) => {
  if (typeof decimalHours !== "number" || isNaN(decimalHours)) return "0分";
  const hrs = Math.floor(decimalHours);
  const mins = Math.round((decimalHours - hrs) * 60);
  if (hrs === 0) return `${mins}分`;
  if (mins === 0) return `${hrs}小時`;
  return `${hrs}小時${mins}分`;
};

const formatCurrency = (amount) => {
  const val = parseFloat(amount);
  if (isNaN(val)) return "$0";
  return new Intl.NumberFormat("zh-TW", {
    style: "currency",
    currency: "TWD",
    minimumFractionDigits: 0,
  }).format(val);
};

// 簡短貨幣格式 (例如 3.7萬)
const formatCurrencyShort = (amount) => {
  const val = parseFloat(amount);
  if (isNaN(val)) return "0";
  if (val >= 10000) {
    return (val / 10000).toFixed(1) + "萬";
  }
  return new Intl.NumberFormat("zh-TW").format(val);
};

const formatNumber = (num) => {
  const val = parseFloat(num);
  if (isNaN(val)) return "0";
  return new Intl.NumberFormat("zh-TW").format(val);
};

const formatDecimal = (num) => {
  const val = parseFloat(num);
  if (isNaN(val)) return "0.0";
  return new Intl.NumberFormat("zh-TW", {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  }).format(val);
};

const formatDateShort = (dateStr) => {
  if (!dateStr) return "";
  const parts = dateStr.split("-");
  if (parts.length < 3) return dateStr;
  return `${parseInt(parts[1])}/${parseInt(parts[2])}`;
};

// ==========================================
// 3. SUB-COMPONENTS
// ==========================================

// --- Simple Bar Chart (Responsive Fixed) ---
const SimpleBarChart = ({
  data,
  valueKey,
  color,
  valueFormatter,
  height = "h-40",
  showLabel = true,
}) => {
  const maxValue = Math.max(...data.map((d) => d[valueKey]), 1) * 1.15;

  return (
    <div
      className={`relative ${height} flex items-end justify-between gap-0.5 sm:gap-2 px-0 sm:px-2 mt-4 overflow-hidden`}
    >
      <div className="absolute inset-0 flex flex-col justify-between pointer-events-none opacity-30">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="border-t border-gray-200 w-full h-px"></div>
        ))}
      </div>
      {data.map((d, i) => {
        const barHeight = (d[valueKey] / maxValue) * 100;
        return (
          <div
            key={i}
            className="flex flex-col items-center flex-1 min-w-0 h-full justify-end group relative z-10"
          >
            {d[valueKey] > 0 && showLabel && (
              <span className="text-[8px] sm:text-[10px] font-bold text-gray-600 mb-1 transition-all transform group-hover:scale-110 whitespace-nowrap">
                {valueFormatter
                  ? valueFormatter(d[valueKey])
                  : formatNumber(d[valueKey])}
              </span>
            )}
            <div
              className={`w-full max-w-[24px] rounded-t-md opacity-90 ${color} transition-all duration-500 group-hover:opacity-100`}
              style={{ height: `${Math.max(barHeight, 1)}%` }}
            ></div>
            <span className="text-[8px] sm:text-[10px] text-gray-400 mt-1 font-medium truncate w-full text-center">
              {d.label}
            </span>
          </div>
        );
      })}
    </div>
  );
};

// --- Combo Chart (Fix Overlap) ---
const ComboChart = ({
  title,
  data,
  barKey,
  lineKey,
  barColor,
  lineColor,
  barLabel,
  lineLabel,
  isCurrency = false,
}) => {
  const maxBar = Math.max(...data.map((d) => d[barKey]), 1) * 1.2;
  const maxLine = Math.max(...data.map((d) => d[lineKey]), 1) * 1.2;

  const points =
    data.length > 1
      ? data
          .map((d, i) => {
            const x = (i / (data.length - 1)) * 100;
            const y = 100 - (d[lineKey] / maxLine) * 100;
            return `${x},${y}`;
          })
          .join(" ")
      : `0,${100 - ((data[0]?.[lineKey] || 0) / maxLine) * 100} 100,${
          100 - ((data[0]?.[lineKey] || 0) / maxLine) * 100
        }`;

  return (
    <div className="bg-white rounded-3xl border border-gray-200 p-5 shadow-sm relative">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-sm font-bold text-gray-800">{title}</h3>
        <div className="flex gap-3 text-[10px]">
          <div className="flex items-center gap-1">
            <div className={`w-2 h-2 rounded-full ${barColor}`}></div>
            <span>{barLabel}</span>
          </div>
          <div className="flex items-center gap-1">
            <div
              className={`w-2 h-2 rounded-full ${lineColor.replace(
                "text-",
                "bg-"
              )}`}
            ></div>
            <span>{lineLabel}</span>
          </div>
        </div>
      </div>

      <div className="h-48 relative">
        <div className="absolute inset-0 flex items-end justify-between z-10 px-1 sm:px-2 gap-0.5 sm:gap-2">
          {data.map((d, i) => {
            const barHeight = (d[barKey] / maxBar) * 100;
            const isTall = barHeight > 15;
            return (
              <div
                key={i}
                className="flex flex-col items-center flex-1 min-w-0 h-full justify-end group relative"
              >
                {d[barKey] > 0 && (
                  <span
                    className={`text-[8px] sm:text-[9px] font-bold absolute z-20 transition-all whitespace-nowrap
                                            ${
                                              isTall
                                                ? "text-white bottom-auto top-1"
                                                : "text-gray-500 bottom-full mb-0.5"
                                            }
                                        `}
                    style={
                      isTall
                        ? {
                            bottom: "auto",
                            top: `${100 - barHeight}%`,
                            paddingTop: "2px",
                          }
                        : {}
                    }
                  >
                    {isCurrency
                      ? `$${formatNumber(d[barKey])}`
                      : formatNumber(d[barKey])}
                  </span>
                )}
                <div
                  className={`w-full max-w-[20px] rounded-t-sm opacity-80 ${barColor} transition-all duration-500`}
                  style={{ height: `${Math.max(barHeight, 1)}%` }}
                ></div>
                <span className="text-[8px] sm:text-[10px] text-gray-400 mt-1 font-medium w-full text-center truncate">
                  {d.label}
                </span>
              </div>
            );
          })}
        </div>

        <div className="absolute inset-0 z-0 px-1 sm:px-2 pointer-events-none mb-5">
          <svg
            width="100%"
            height="100%"
            viewBox="0 0 100 100"
            preserveAspectRatio="none"
            style={{ overflow: "visible" }}
          >
            <polyline
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              points={points}
              vectorEffect="non-scaling-stroke"
              className={`${lineColor}`}
            />
          </svg>
        </div>

        <div className="absolute inset-0 z-30 px-1 sm:px-2 pointer-events-none mb-5">
          {data.map((d, i) => {
            if (d[lineKey] === 0) return null;
            const left = data.length > 1 ? (i / (data.length - 1)) * 100 : 50;
            const bottom = (d[lineKey] / maxLine) * 100;
            return (
              <div
                key={i}
                className="absolute flex flex-col items-center"
                style={{
                  left: `${left}%`,
                  bottom: `${bottom}%`,
                  transform: "translate(-50%, 50%)",
                }}
              >
                <div
                  className={`w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full border-2 border-white shadow-sm ${lineColor.replace(
                    "text-",
                    "bg-"
                  )}`}
                ></div>
                <span
                  className={`text-[8px] sm:text-[9px] font-bold mb-1 absolute bottom-2 bg-white/90 px-1 rounded shadow-sm whitespace-nowrap ${lineColor}`}
                >
                  {formatDecimal(d[lineKey])}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

// 1. Top Stats Card
const OverviewStats = memo(({ annualStats, todayStats }) => (
  <div className="space-y-4">
    <div className="grid grid-cols-2 gap-4">
      <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm relative overflow-hidden">
        <div className="absolute top-0 right-0 p-2 opacity-5 text-gray-900">
          <Wallet size={56} />
        </div>
        <div className="text-xs text-gray-500 font-bold mb-1 tracking-wide">
          {annualStats.year}年 總收入
        </div>
        <div className="text-2xl font-extrabold text-gray-900 tracking-tight">
          {formatCurrency(annualStats.totalIncome)}
        </div>
      </div>
      <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm relative overflow-hidden">
        <div className="absolute top-0 right-0 p-2 opacity-5 text-gray-900">
          <Bike size={56} />
        </div>
        <div className="text-xs text-gray-500 font-bold mb-1 tracking-wide">
          {annualStats.year}年 總單量
        </div>
        <div className="text-2xl font-extrabold text-gray-900 tracking-tight">
          {formatNumber(annualStats.totalTrips)} 單
        </div>
      </div>
    </div>

    <div className="grid grid-cols-3 gap-3">
      <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-sm flex flex-col justify-center items-center">
        <div className="text-xs text-gray-500 font-bold mb-1">平均時薪</div>
        <div className="text-xl font-extrabold text-emerald-600">
          ${formatNumber(annualStats.avgHourly.toFixed(0))}
        </div>
      </div>
      <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-sm flex flex-col justify-center items-center">
        <div className="text-xs text-gray-500 font-bold mb-1 text-center">
          每趟淨行程
        </div>
        <div className="text-xl font-extrabold text-gray-900">
          ${formatDecimal(annualStats.avgNetTrip)}
        </div>
      </div>
      <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-sm flex flex-col justify-center items-center">
        <div className="text-xs text-gray-500 font-bold mb-1 text-center leading-tight">
          含獎勵
          <br />
          均價
        </div>
        <div className="text-xl font-extrabold text-emerald-600">
          ${formatDecimal(annualStats.avgGrossTrip)}
        </div>
      </div>
    </div>

    <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">
      <div className="flex justify-between items-center mb-3">
        <div className="flex items-center gap-2">
          <div className="bg-emerald-100 text-emerald-600 p-1.5 rounded-lg">
            <Calendar size={18} />
          </div>
          <span className="font-bold text-gray-900 text-lg">今日戰績</span>
        </div>
        <span className="text-sm text-gray-500 font-medium">
          {new Date().toLocaleDateString("zh-TW")}
        </span>
      </div>
      {todayStats.hasRecord ? (
        <div className="flex items-end gap-2">
          <span className="text-5xl font-black text-gray-900 tracking-tighter">
            {formatCurrency(todayStats.income)}
          </span>
          <div className="text-sm text-gray-500 mb-2 font-medium flex gap-2">
            <span className="bg-gray-100 px-2 py-0.5 rounded-md">
              {todayStats.trips} 單
            </span>
            <span className="bg-gray-100 px-2 py-0.5 rounded-md">
              {formatDuration(todayStats.time)}
            </span>
          </div>
        </div>
      ) : (
        <div className="text-gray-400 text-base py-2">
          今天還沒開始跑單嗎？加油！💪
        </div>
      )}
    </div>
  </div>
));

// 2. Weekly View Component
const WeeklyView = memo(({ weeklyStats, handleWeekChange }) => (
  <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
    <div className="bg-white rounded-3xl border border-gray-200 p-4 sm:p-6 shadow-sm space-y-6">
      <div className="flex items-center justify-between">
        <button
          onClick={() => handleWeekChange(-1)}
          className="p-2.5 bg-gray-50 text-gray-500 hover:bg-gray-100 hover:text-gray-900 rounded-full transition-colors"
        >
          <ChevronLeft size={22} />
        </button>
        <div className="flex flex-col items-center">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-sm text-gray-500 font-bold uppercase tracking-wide">
              第{weeklyStats.weekNumber}週收入
            </span>
            {weeklyStats.recordCount > 0 && (
              <span className="text-[10px] bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full font-bold">
                共{weeklyStats.recordCount}單
              </span>
            )}
          </div>
          <div className="text-2xl font-black text-gray-900 flex items-center gap-2">
            {formatCurrency(weeklyStats.totalIncome)}
          </div>
          <span className="text-xs text-gray-400 mt-1 font-medium bg-gray-50 px-2 py-0.5 rounded">
            {formatDateShort(weeklyStats.startStr)} -{" "}
            {formatDateShort(weeklyStats.endStr)}
          </span>
        </div>
        <button
          onClick={() => handleWeekChange(1)}
          className="p-2.5 bg-gray-50 text-gray-500 hover:bg-gray-100 hover:text-gray-900 rounded-full transition-colors"
        >
          <ChevronRight size={22} />
        </button>
      </div>

      <div className="h-44 flex items-end justify-between gap-1 sm:gap-2 px-0 sm:px-1 relative">
        <div className="absolute inset-0 flex flex-col justify-between pointer-events-none opacity-50">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="border-t border-gray-100 w-full h-px"></div>
          ))}
        </div>
        {weeklyStats.dailyData.map((day, index) => {
          const heightPct =
            weeklyStats.maxDailyIncome > 0
              ? (day.income / weeklyStats.maxDailyIncome) * 100
              : 0;
          return (
            <div
              key={index}
              className="flex flex-col items-center gap-1 sm:gap-2 flex-1 min-w-0 group z-10 h-full justify-end"
            >
              <div className="relative w-full flex justify-end flex-col items-center h-[85%]">
                {day.income > 0 && (
                  <div className="mb-1 text-[10px] text-gray-600 font-bold bg-white shadow-sm px-1.5 py-0.5 rounded border border-gray-200 transform -translate-y-1 hidden sm:block">
                    ${formatNumber(day.income)}
                  </div>
                )}
                <div
                  className={`w-full sm:w-10 rounded-t-lg transition-all duration-500 ${
                    day.isToday
                      ? "bg-emerald-500 shadow-md ring-2 ring-emerald-200"
                      : day.income > 0
                      ? "bg-emerald-400"
                      : "bg-gray-100"
                  }`}
                  style={{ height: `${Math.max(heightPct, 4)}%` }}
                ></div>
              </div>
              <span
                className={`text-[10px] sm:text-xs h-[15px] font-bold ${
                  day.isToday ? "text-emerald-600" : "text-gray-400"
                }`}
              >
                {day.dayLabel}
              </span>
            </div>
          );
        })}
      </div>

      <div className="space-y-3 pt-2">
        <h3 className="text-sm font-bold text-gray-900 ml-1">效率分析</h3>
        <div className="grid grid-cols-3 gap-2 sm:gap-3">
          <div className="bg-gray-50 p-2 sm:p-3 rounded-xl text-center border border-gray-100">
            <div className="text-[10px] sm:text-xs text-gray-500 mb-1 flex items-center justify-center gap-1 font-medium">
              <Clock size={12} /> 總工時
            </div>
            <div className="text-base sm:text-lg font-extrabold text-gray-900">
              {formatDecimal(weeklyStats.totalHours)}
              <span className="text-[10px] sm:text-xs font-normal text-gray-400 ml-0.5">
                h
              </span>
            </div>
          </div>
          <div className="bg-gray-50 p-2 sm:p-3 rounded-xl text-center border border-gray-100">
            <div className="text-[10px] sm:text-xs text-gray-500 mb-1 flex items-center justify-center gap-1 font-medium">
              <Bike size={12} /> 總單量
            </div>
            <div className="text-base sm:text-lg font-extrabold text-gray-900">
              {weeklyStats.totalTrips}
            </div>
          </div>
          <div className="bg-emerald-50 p-2 sm:p-3 rounded-xl text-center border border-emerald-100">
            <div className="text-[10px] sm:text-xs text-emerald-700 mb-1 flex items-center justify-center gap-1 font-medium">
              <Activity size={12} /> 當週時薪
            </div>
            <div className="text-base sm:text-lg font-extrabold text-emerald-600">
              ${formatDecimal(weeklyStats.weeklyHourlyWage)}
            </div>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-2 sm:gap-3">
          <div className="bg-white p-2 sm:p-3 rounded-xl flex justify-between items-center px-3 sm:px-4 border border-gray-200 shadow-sm">
            <div className="text-[10px] sm:text-xs text-gray-500 font-medium">
              每趟
              <br />
              淨行程
            </div>
            <div className="text-base sm:text-xl font-extrabold text-gray-900">
              ${formatDecimal(weeklyStats.avgNetTripCost)}
            </div>
          </div>
          <div className="bg-white p-2 sm:p-3 rounded-xl flex justify-between items-center px-3 sm:px-4 border border-gray-200 shadow-sm">
            <div className="text-[10px] sm:text-xs text-gray-500 flex flex-col font-medium">
              <span className="flex items-center gap-1 text-emerald-600">
                <TrendingUp size={12} /> 含獎勵
              </span>
              <span>每趟平均</span>
            </div>
            <div className="text-base sm:text-xl font-extrabold text-emerald-600">
              ${formatDecimal(weeklyStats.avgGrossTripCost)}
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
));

// 3. Monthly View Component
const MonthlyView = memo(
  ({
    selectedMonth,
    setSelectedMonth,
    currentYearView,
    setCurrentYearView,
    monthlyDataMap,
    currentSelectedMonthData,
    currentMonthStats,
  }) => {
    const [isDetailListView, setIsDetailListView] = useState(false);
    const calendarDays = useMemo(() => {
      if (!currentSelectedMonthData) return [];
      const { year, month, records } = currentSelectedMonthData;
      const daysInMonth = new Date(year, month, 0).getDate();
      const firstDayObj = new Date(year, month - 1, 1);
      let startDay = firstDayObj.getDay();
      let offset = startDay === 0 ? 6 : startDay - 1;
      const days = [];
      for (let i = 0; i < offset; i++) days.push(null);
      for (let i = 1; i <= daysInMonth; i++) {
        const dateStr = `${year}-${String(month).padStart(2, "0")}-${String(
          i
        ).padStart(2, "0")}`;
        const record = records.find(
          (r) => getLocalDateString(r.date) === dateStr
        );
        days.push({ day: i, record });
      }
      return days;
    }, [currentSelectedMonthData]);

    const sortedMonthRecords = useMemo(() => {
      if (!currentSelectedMonthData) return [];
      return [...currentSelectedMonthData.records].sort(
        (a, b) => new Date(b.date) - new Date(a.date)
      );
    }, [currentSelectedMonthData]);

    const handleMonthNavigate = (direction) => {
      if (!selectedMonth) return;
      const [y, m] = selectedMonth.split("-").map(Number);
      const newDate = new Date(y, m - 1 + direction, 1);
      const newKey = `${newDate.getFullYear()}-${String(
        newDate.getMonth() + 1
      ).padStart(2, "0")}`;
      setSelectedMonth(newKey);
    };

    return (
      <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-300 mt-4">
        {!selectedMonth && (
          <>
            <div className="bg-gradient-to-r from-emerald-500 to-teal-500 rounded-3xl p-5 shadow-md text-white mb-2 relative overflow-hidden">
              <div className="absolute right-0 top-0 opacity-10 transform translate-x-4 -translate-y-4">
                <DollarSign size={100} />
              </div>
              <div className="relative z-10">
                <div className="text-emerald-100 text-xs font-bold mb-1 uppercase tracking-wider flex items-center gap-1">
                  <Calendar size={12} /> 本月 ({currentMonthStats.month}月)
                  累積收入
                </div>
                <div className="text-3xl font-black tracking-tight">
                  {formatCurrency(currentMonthStats.totalIncome)}
                </div>
                <div className="flex gap-3 mt-2 text-xs font-medium text-emerald-50">
                  <span>{currentMonthStats.tripCount} 單</span>
                  <span>•</span>
                  <span>{formatDecimal(currentMonthStats.totalHours)} h</span>
                </div>
              </div>
            </div>
            <div className="flex items-center justify-between px-2 mb-4">
              <button
                onClick={() => setCurrentYearView((prev) => prev - 1)}
                className="p-2 bg-white border border-gray-200 rounded-lg text-gray-500"
              >
                <ChevronLeft size={20} />
              </button>
              <h2 className="text-xl font-black text-gray-900">
                {currentYearView}年
              </h2>
              <button
                onClick={() => setCurrentYearView((prev) => prev + 1)}
                className="p-2 bg-white border border-gray-200 rounded-lg text-gray-500"
              >
                <ChevronRight size={20} />
              </button>
            </div>
            <div className="grid grid-cols-3 gap-3">
              {Array.from({ length: 12 }, (_, i) => {
                const m = i + 1;
                const key = `${currentYearView}-${String(m).padStart(2, "0")}`;
                const data = monthlyDataMap[key];
                const hasData = data && data.totalIncome > 0;
                return (
                  <button
                    key={m}
                    onClick={() => hasData && setSelectedMonth(key)}
                    disabled={!hasData}
                    className={`p-3 rounded-2xl border flex flex-col items-center justify-between min-h-[90px] transition-all relative overflow-hidden ${
                      hasData
                        ? "bg-white border-emerald-100 shadow-sm active:scale-95"
                        : "bg-gray-50 border-gray-100 opacity-60 cursor-default"
                    }`}
                  >
                    <span
                      className={`text-sm font-bold ${
                        hasData ? "text-gray-900" : "text-gray-400"
                      }`}
                    >
                      {m}月
                    </span>
                    {hasData ? (
                      <>
                        <div className="text-emerald-600 font-black text-sm mt-1">
                          {formatCurrencyShort(data.totalIncome)}
                        </div>
                        <div className="text-[10px] text-gray-500 mt-1 font-medium flex flex-col items-center leading-tight">
                          <span>{data.tripCount}單</span>
                          <span>{formatDecimal(data.totalHours)}h</span>
                        </div>
                        <div className="absolute bottom-0 left-0 right-0 h-1 bg-emerald-400"></div>
                      </>
                    ) : (
                      <span className="text-[10px] text-gray-300 mt-2">
                        無紀錄
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </>
        )}
        {selectedMonth && currentSelectedMonthData && (
          <div className="animate-in slide-in-from-right duration-300 space-y-6 mt-6">
            <div className="flex items-center justify-between px-1 mb-2">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setSelectedMonth(null)}
                  className="p-2 bg-white border border-gray-200 rounded-full text-gray-600 hover:bg-gray-50"
                >
                  <ArrowLeft size={20} />
                </button>
                <div>
                  <h2 className="text-xl font-black text-gray-900">
                    {currentSelectedMonthData.year}年{" "}
                    {currentSelectedMonthData.month}月
                  </h2>
                  <span className="text-xs text-gray-500 font-bold">
                    月報表詳情
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => handleMonthNavigate(-1)}
                  className="p-2 bg-white border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50"
                >
                  <ChevronLeft size={20} />
                </button>
                <button
                  onClick={() => handleMonthNavigate(1)}
                  className="p-2 bg-white border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50"
                >
                  <ChevronRight size={20} />
                </button>
              </div>
            </div>

            <div className="bg-white rounded-3xl border border-gray-200 p-6 shadow-sm space-y-6">
              <div className="text-center">
                <div className="text-sm text-gray-500 font-bold mb-1">
                  本月總收入
                </div>
                <div className="text-4xl font-black text-gray-900">
                  {formatCurrency(currentSelectedMonthData.totalIncome)}
                </div>
              </div>
              <div className="grid grid-cols-3 gap-3 pt-4 border-t border-gray-100">
                <div className="text-center p-2 rounded-xl bg-gray-50">
                  <div className="text-xs text-gray-500 mb-1 font-medium">
                    行程費用
                  </div>
                  <div className="text-base font-bold text-gray-900">
                    ${formatNumber(currentSelectedMonthData.tripCost)}
                  </div>
                </div>
                <div className="text-center p-2 rounded-xl bg-gray-50">
                  <div className="text-xs text-gray-500 mb-1 font-medium">
                    獎勵
                  </div>
                  <div className="text-base font-bold text-emerald-600">
                    ${formatNumber(currentSelectedMonthData.promo)}
                  </div>
                </div>
                <div className="text-center p-2 rounded-xl bg-gray-50">
                  <div className="text-xs text-gray-500 mb-1 font-medium">
                    小費
                  </div>
                  <div className="text-base font-bold text-yellow-600">
                    ${formatNumber(currentSelectedMonthData.tips)}
                  </div>
                </div>
              </div>
              <div className="space-y-3 pt-2">
                <h3 className="text-base font-bold text-gray-900 ml-1">
                  月效率分析
                </h3>
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-white p-4 rounded-xl flex flex-col justify-center items-center border border-gray-200 shadow-sm">
                    <div className="text-xs text-gray-500 font-bold mb-1">
                      平均時薪
                    </div>
                    <div className="text-2xl font-extrabold text-emerald-600">
                      $
                      {formatNumber(
                        currentSelectedMonthData.hourlyWage.toFixed(0)
                      )}
                    </div>
                  </div>
                  <div className="bg-white p-4 rounded-xl flex flex-col justify-center items-center border border-gray-200 shadow-sm">
                    <div className="text-xs text-gray-500 font-bold mb-1">
                      每小時單量
                    </div>
                    <div className="text-2xl font-extrabold text-gray-900">
                      {formatDecimal(currentSelectedMonthData.tripsPerHour)}
                    </div>
                  </div>
                  <div className="bg-white p-4 rounded-xl flex flex-col justify-center items-center border border-gray-200 shadow-sm">
                    <div className="text-xs text-gray-500 font-bold mb-1">
                      每趟淨行程
                    </div>
                    <div className="text-2xl font-extrabold text-gray-900">
                      ${formatDecimal(currentSelectedMonthData.avgNetTripCost)}
                    </div>
                  </div>
                  <div className="bg-white p-4 rounded-xl flex flex-col justify-center items-center border border-gray-200 shadow-sm">
                    <div className="text-xs text-gray-500 font-bold mb-1">
                      含獎勵均價
                    </div>
                    <div className="text-2xl font-extrabold text-emerald-600">
                      $
                      {formatDecimal(currentSelectedMonthData.avgGrossTripCost)}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div>
              <div className="flex justify-between items-center mb-3 px-1">
                <h3 className="text-lg font-bold text-gray-800">每日明細</h3>
                <button
                  onClick={() => setIsDetailListView(!isDetailListView)}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 hover:bg-gray-200 rounded-full text-xs font-bold text-gray-600 transition-colors"
                >
                  {isDetailListView ? (
                    <Grid3X3 size={14} />
                  ) : (
                    <List size={14} />
                  )}
                  {isDetailListView ? "切換月曆" : "切換列表"}
                </button>
              </div>
              {!isDetailListView ? (
                <div className="bg-white rounded-3xl border border-gray-200 p-4 shadow-sm">
                  <div className="grid grid-cols-7 gap-1 mb-2 text-center">
                    {["一", "二", "三", "四", "五", "六", "日"].map((d) => (
                      <div
                        key={d}
                        className="text-sm text-gray-400 font-bold py-1"
                      >
                        {d}
                      </div>
                    ))}
                  </div>
                  <div className="grid grid-cols-7 gap-1">
                    {calendarDays.map((item, idx) => {
                      if (!item)
                        return (
                          <div key={`empty-${idx}`} className="h-14"></div>
                        );
                      const hasRecord = !!item.record;
                      const isHighIncome =
                        hasRecord && item.record.totalIncome > 2000;
                      return (
                        <div
                          key={`day-${item.day}`}
                          className={`h-14 rounded-xl flex flex-col items-center justify-center relative border ${
                            hasRecord
                              ? isHighIncome
                                ? "bg-emerald-50 border-emerald-200"
                                : "bg-gray-50 border-gray-200"
                              : "border-transparent"
                          }`}
                        >
                          <div
                            className={`text-[10px] font-bold absolute top-0.5 left-1.5 ${
                              hasRecord ? "text-gray-400" : "text-gray-300"
                            }`}
                          >
                            {item.day}
                          </div>
                          {hasRecord && (
                            <div className="flex flex-col items-center justify-center w-full leading-none mt-1">
                              <span className="text-xs sm:text-sm font-black text-emerald-600 tracking-tight">
                                {formatNumber(item.record.totalIncome)}
                              </span>
                              <span className="text-[10px] sm:text-xs text-gray-500 font-bold mt-0.5">
                                {item.record.tripCount}單
                              </span>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  {sortedMonthRecords.map((record) => (
                    <div
                      key={record.id}
                      className="bg-white border border-gray-200 rounded-2xl p-4 shadow-sm flex justify-between items-center"
                    >
                      <div className="flex items-center gap-3">
                        <div className="bg-gray-100 text-gray-600 font-bold p-2 rounded-lg text-sm flex flex-col items-center min-w-[50px]">
                          <span>{new Date(record.date).getDate()}日</span>
                        </div>
                        <div>
                          <div className="text-lg font-black text-gray-900">
                            {formatCurrency(record.totalIncome)}
                          </div>
                          <div className="text-xs text-gray-500 font-medium">
                            {record.tripCount}單 •{" "}
                            {formatDuration(record.totalHoursDec)}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full mb-1">
                          時薪 ${record.hourlyWage.toFixed(0)}
                        </div>
                        <div className="text-[10px] text-gray-400">
                          均單 {formatDecimal(record.tripsPerHour)}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    );
  }
);

// 4. Annual View Component (Refined)
const AnnualView = memo(
  ({ currentYearView, setCurrentYearView, monthlyDataMap, annualStats }) => {
    const [activeTab, setActiveTab] = useState("income"); // income, trips, hours

    const chartData = useMemo(() => {
      return Array.from({ length: 12 }, (_, i) => {
        const m = i + 1;
        const key = `${currentYearView}-${String(m).padStart(2, "0")}`;
        const d = monthlyDataMap[key] || {
          totalIncome: 0,
          tripCount: 0,
          totalHours: 0,
        };
        const hourlyWage = d.totalHours > 0 ? d.totalIncome / d.totalHours : 0;
        const tripsPerHour = d.totalHours > 0 ? d.tripCount / d.totalHours : 0;
        return {
          label: `${m}月`,
          income: d.totalIncome,
          trips: d.tripCount,
          hours: d.totalHours,
          hourly: hourlyWage,
          tph: tripsPerHour,
        };
      });
    }, [currentYearView, monthlyDataMap]);

    const summary = useMemo(() => {
      let tripCost = 0,
        promo = 0,
        tips = 0,
        hours = 0;
      let fullDays = 0,
        halfDays = 0,
        offDays = 0;

      const yearRecords = [];
      Object.values(monthlyDataMap).forEach((d) => {
        if (d.year === currentYearView) {
          tripCost += d.tripCost;
          promo += d.promo;
          tips += d.tips;
          hours += d.totalHours;
          yearRecords.push(...d.records);
        }
      });

      const dailyHours = {};
      yearRecords.forEach((r) => {
        const dStr = getLocalDateString(r.date);
        dailyHours[dStr] = (dailyHours[dStr] || 0) + r.totalHoursDec;
      });

      Object.values(dailyHours).forEach((h) => {
        if (h <= 1) offDays++;
        else if (h < 4) halfDays++;
        else fullDays++;
      });

      const now = new Date();
      let remainingDays = 0;
      if (currentYearView === now.getFullYear()) {
        const endOfYear = new Date(currentYearView, 11, 31);
        const diffTime = endOfYear - now;
        remainingDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        if (remainingDays < 0) remainingDays = 0;
      }

      return {
        tripCost,
        promo,
        tips,
        hours,
        fullDays,
        halfDays,
        offDays,
        remainingDays,
      };
    }, [monthlyDataMap, currentYearView]);

    const mainChartProps = useMemo(() => {
      switch (activeTab) {
        case "trips":
          return {
            valueKey: "trips",
            color: "bg-orange-400",
            valueFormatter: formatNumber,
          };
        case "hours":
          return {
            valueKey: "hours",
            color: "bg-blue-400",
            valueFormatter: formatDecimal,
          };
        // Updated: Use formatCurrencyShort for income bar charts
        default:
          return {
            valueKey: "income",
            color: "bg-emerald-400",
            valueFormatter: (v) => `${formatCurrencyShort(v)}`,
          };
      }
    }, [activeTab]);

    return (
      <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300 mt-4">
        <div className="flex items-center justify-between px-2 mb-4">
          <button
            onClick={() => setCurrentYearView((prev) => prev - 1)}
            className="p-2 bg-white border border-gray-200 rounded-lg text-gray-500"
          >
            <ChevronLeft size={20} />
          </button>
          <h2 className="text-xl font-black text-gray-900">
            {currentYearView}年 報表
          </h2>
          <button
            onClick={() => setCurrentYearView((prev) => prev + 1)}
            className="p-2 bg-white border border-gray-200 rounded-lg text-gray-500"
          >
            <ChevronRight size={20} />
          </button>
        </div>

        {/* Section 1: Switchable Main Chart */}
        <div className="bg-white rounded-3xl border border-gray-200 p-5 shadow-sm">
          <div className="flex bg-gray-100 p-1 rounded-xl mb-4">
            <button
              onClick={() => setActiveTab("income")}
              className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${
                activeTab === "income"
                  ? "bg-white text-emerald-600 shadow-sm"
                  : "text-gray-500"
              }`}
            >
              每月收入
            </button>
            <button
              onClick={() => setActiveTab("trips")}
              className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${
                activeTab === "trips"
                  ? "bg-white text-orange-500 shadow-sm"
                  : "text-gray-500"
              }`}
            >
              總單量
            </button>
            <button
              onClick={() => setActiveTab("hours")}
              className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${
                activeTab === "hours"
                  ? "bg-white text-blue-500 shadow-sm"
                  : "text-gray-500"
              }`}
            >
              總時數
            </button>
          </div>
          <h3 className="text-sm font-bold text-gray-800 ml-1 mb-2">
            {activeTab === "income"
              ? "每月總收入"
              : activeTab === "trips"
              ? "每月總單量"
              : "每月總時數"}
          </h3>
          <SimpleBarChart
            data={chartData}
            valueKey={mainChartProps.valueKey}
            color={mainChartProps.color}
            valueFormatter={mainChartProps.valueFormatter}
          />
        </div>

        {/* Section 2: Efficiency Charts (Merged) */}
        <ComboChart
          title="平均時薪 & 每小時單量"
          data={chartData}
          barKey="hourly"
          lineKey="tph"
          barColor="bg-blue-400"
          lineColor="text-purple-400"
          barLabel="時薪"
          lineLabel="時均單"
          isCurrency={true}
        />

        {/* Annual Summary Grid */}
        <div className="bg-white rounded-3xl border border-gray-200 p-6 shadow-sm space-y-6">
          <h3 className="text-lg font-bold text-gray-800">年度總結算</h3>
          <div className="grid grid-cols-3 gap-3 pt-2">
            <div className="bg-gray-50 p-3 rounded-xl text-center border border-gray-100">
              <div className="text-xs text-gray-500 mb-1 font-bold">
                行程費用
              </div>
              <div className="text-sm font-black text-gray-900">
                ${formatNumber(summary.tripCost)}
              </div>
            </div>
            <div className="bg-emerald-50 p-3 rounded-xl text-center border border-emerald-100">
              <div className="text-xs text-emerald-600 mb-1 font-bold">
                獎勵
              </div>
              <div className="text-sm font-black text-emerald-600">
                ${formatNumber(summary.promo)}
              </div>
            </div>
            <div className="bg-yellow-50 p-3 rounded-xl text-center border border-yellow-100">
              <div className="text-xs text-yellow-600 mb-1 font-bold">小費</div>
              <div className="text-sm font-black text-yellow-600">
                ${formatNumber(summary.tips)}
              </div>
            </div>
          </div>
          <div className="bg-gradient-to-r from-emerald-500 to-teal-500 rounded-xl p-4 flex justify-between items-center px-5 shadow-lg text-white">
            <span className="text-xs font-bold text-emerald-100 uppercase tracking-wider">
              年度總收入
            </span>
            <span className="text-2xl font-black tracking-tight">
              {formatCurrency(annualStats.totalIncome)}
            </span>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-white p-3 rounded-xl border border-gray-200 shadow-sm flex flex-col items-center">
              <div className="text-xs text-gray-500 font-bold mb-1">總工時</div>
              <div className="text-xl font-black text-gray-900">
                {formatDecimal(summary.hours)}h
              </div>
            </div>
            <div className="bg-white p-3 rounded-xl border border-gray-200 shadow-sm flex flex-col items-center">
              <div className="text-xs text-gray-500 font-bold mb-1">
                平均時薪
              </div>
              <div className="text-xl font-black text-emerald-600">
                ${formatDecimal(annualStats.avgHourly)}
              </div>
            </div>
            <div className="bg-white p-3 rounded-xl border border-gray-200 shadow-sm flex flex-col items-center">
              <div className="text-xs text-gray-500 font-bold mb-1">
                淨行程均價
              </div>
              <div className="text-xl font-black text-gray-900">
                ${formatDecimal(annualStats.avgNetTrip)}
              </div>
            </div>
            <div className="bg-white p-3 rounded-xl border border-gray-200 shadow-sm flex flex-col items-center">
              <div className="text-xs text-gray-500 font-bold mb-1">
                含獎勵均價
              </div>
              <div className="text-xl font-black text-emerald-600">
                ${formatDecimal(annualStats.avgGrossTrip)}
              </div>
            </div>
          </div>

          {/* Work Days Analysis Section */}
          <div className="pt-4 border-t border-gray-100">
            <h4 className="text-sm font-bold text-gray-800 mb-3">
              出勤天數分析
            </h4>
            <div className="grid grid-cols-3 gap-3">
              <div className="flex flex-col items-center p-3 bg-orange-50 rounded-xl border border-orange-100">
                <Sun size={20} className="text-orange-500 mb-1" />
                <span className="text-xs text-gray-500 font-bold">整天班</span>
                <span className="text-lg font-black text-orange-600">
                  {summary.fullDays}
                  <span className="text-xs font-normal text-orange-400 ml-0.5">
                    天
                  </span>
                </span>
              </div>
              <div className="flex flex-col items-center p-3 bg-blue-50 rounded-xl border border-blue-100">
                <CloudSun size={20} className="text-blue-500 mb-1" />
                <span className="text-xs text-gray-500 font-bold">半天班</span>
                <span className="text-lg font-black text-blue-600">
                  {summary.halfDays}
                  <span className="text-xs font-normal text-blue-400 ml-0.5">
                    天
                  </span>
                </span>
              </div>
              <div className="flex flex-col items-center p-3 bg-gray-50 rounded-xl border border-gray-200">
                <Palmtree size={20} className="text-gray-400 mb-1" />
                <span className="text-xs text-gray-500 font-bold">
                  休假/輕鬆
                </span>
                <span className="text-lg font-black text-gray-600">
                  {summary.offDays}
                  <span className="text-xs font-normal text-gray-400 ml-0.5">
                    天
                  </span>
                </span>
              </div>
            </div>
            {/* Remaining Days */}
            {summary.remainingDays > 0 && (
              <div className="mt-3 bg-indigo-50 border border-indigo-100 rounded-xl p-3 flex items-center justify-center gap-2 text-indigo-600">
                <Hourglass size={16} />
                <span className="text-xs font-bold">
                  今年剩餘{" "}
                  <span className="text-base font-black">
                    {summary.remainingDays}
                  </span>{" "}
                  天
                </span>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }
);

// 5. Recent Record List
const RecentRecordList = memo(
  ({ recentStats, sheetUrl, fetchFromSheet, isLoading, handleDelete }) => (
    <div className="mt-8">
      <div className="flex justify-between items-end mb-4 px-1">
        <div className="flex flex-col">
          <h2 className="text-lg font-bold text-gray-800">
            最近7天紀錄 (不含今日)
          </h2>
          <span className="text-xs text-gray-400 font-medium mt-0.5">
            {formatDateShort(recentStats.startStr)} -{" "}
            {formatDateShort(recentStats.endStr)}
          </span>
        </div>
        <div className="flex items-center gap-3">
          {sheetUrl && (
            <button
              onClick={() => fetchFromSheet()}
              disabled={isLoading}
              className="p-2.5 rounded-full bg-white border border-gray-200 text-gray-500 hover:text-emerald-600 active:scale-95 transition-all shadow-sm"
            >
              {isLoading ? (
                <RefreshCw className="animate-spin w-4 h-4" />
              ) : (
                <DownloadCloud className="w-4 h-4" />
              )}
            </button>
          )}
          <span className="text-xs text-gray-500 bg-gray-100 px-3 py-1.5 rounded-full font-medium">
            {recentStats.records.length} 單
          </span>
        </div>
      </div>
      {isLoading && recentStats.records.length === 0 ? (
        <div className="space-y-4 animate-pulse">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-32 bg-gray-200 rounded-2xl"></div>
          ))}
        </div>
      ) : (
        <div className="space-y-4">
          {recentStats.records.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-gray-400 space-y-4 bg-white rounded-3xl border border-gray-100">
              <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center border border-gray-100">
                <Calendar className="w-8 h-8 opacity-30" />
              </div>
              <p>最近7天無紀錄</p>
            </div>
          ) : (
            recentStats.records.map((record) => (
              <div
                key={record.id}
                className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm relative overflow-hidden group"
              >
                <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-emerald-500"></div>
                <div className="flex justify-between items-start mb-4 pl-3">
                  <div>
                    <div className="flex items-center gap-2 text-gray-500 text-sm mb-1 font-medium">
                      <Calendar size={16} />
                      {new Date(record.date).toLocaleDateString("zh-TW", {
                        year: "numeric",
                        month: "2-digit",
                        day: "2-digit",
                      })}
                    </div>
                    <div className="text-2xl font-black text-gray-900">
                      {formatCurrency(record.totalIncome)}
                    </div>
                  </div>
                  <button
                    onClick={() => handleDelete(record.id)}
                    className="text-gray-400 hover:text-red-500 transition-colors p-2 bg-gray-50 rounded-full"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
                <div className="grid grid-cols-3 gap-2 pl-3">
                  <div className="bg-gray-50 rounded-xl p-3 border border-gray-100">
                    <div className="text-xs text-gray-500 uppercase tracking-wider mb-1 font-bold">
                      時薪
                    </div>
                    <div className="text-emerald-600 font-extrabold text-lg">
                      ${record.hourlyWage.toFixed(0)}
                    </div>
                  </div>
                  <div className="bg-gray-50 rounded-xl p-3 border border-gray-100">
                    <div className="text-xs text-gray-500 uppercase tracking-wider mb-1 font-bold">
                      每小時單量
                    </div>
                    <div className="text-gray-900 font-extrabold text-lg">
                      {record.tripsPerHour.toFixed(1)}
                    </div>
                  </div>
                  <div className="bg-gray-50 rounded-xl p-3 border border-gray-100">
                    <div className="text-xs text-gray-500 uppercase tracking-wider mb-1 font-bold">
                      工時
                    </div>
                    <div className="text-gray-900 font-extrabold text-base leading-7">
                      {formatDuration(record.totalHoursDec)}
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  )
);

// ==========================================
// 5. MAIN APPLICATION
// ==========================================

export default function UberTrackV16_0_NoFOUC() {
  const [isStyleLoaded, setIsStyleLoaded] = useState(false);
  const [records, setRecords] = useState(() => {
    // SAFE LOCALSTORAGE: Try/Catch to prevent iframe security errors
    try {
      const saved = localStorage.getItem("uber_records");
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      console.warn("LocalStorage access denied in this environment.");
      return [];
    }
  });

  const [sheetUrl, setSheetUrl] = useState(() => {
    try {
      if (FIXED_SHEET_URL) return FIXED_SHEET_URL;
      return localStorage.getItem("uber_sheet_url") || "";
    } catch (e) {
      return "";
    }
  });

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [viewMode, setViewMode] = useState("weekly");
  const [currentWeekBase, setCurrentWeekBase] = useState(new Date());
  const [currentYearView, setCurrentYearView] = useState(
    new Date().getFullYear()
  );
  const [selectedMonth, setSelectedMonth] = useState(null);

  const [formData, setFormData] = useState({
    date: getLocalDateString(new Date()),
    tripCost: "",
    promo: "",
    tips: "",
    hours: "",
    minutes: "",
    tripCount: "",
  });

  // Auto-inject Tailwind for portability AND Handle FOUC
  useEffect(() => {
    if (document.getElementById("tailwind-cdn")) {
      setIsStyleLoaded(true);
      return;
    }
    const script = document.createElement("script");
    script.id = "tailwind-cdn";
    script.src = "https://cdn.tailwindcss.com";
    script.onload = () => setIsStyleLoaded(true);
    script.onerror = () => setIsStyleLoaded(true); // Fail-safe
    document.head.appendChild(script);
  }, []);

  // Safe Save
  useEffect(() => {
    try {
      localStorage.setItem("uber_records", JSON.stringify(records));
    } catch (e) {}
  }, [records]);

  // Unified Data Calculation Hook
  const stats = useMemo(() => {
    const currentYear = new Date().getFullYear();
    const todayStr = getLocalDateString(new Date());

    let annualIncome = 0,
      annualTime = 0,
      annualTrips = 0,
      annualTripCost = 0,
      annualPromo = 0;
    let todayData = { income: 0, time: 0, trips: 0, hasRecord: false };
    const mData = {};
    const rMap = {};

    const validRecords = Array.isArray(records) ? records : [];

    validRecords.forEach((r) => {
      const dStr = getLocalDateString(r.date);
      if (!dStr) return;

      if (!rMap[dStr]) {
        rMap[dStr] = { ...r, count: 1 };
      } else {
        rMap[dStr].totalIncome += r.totalIncome;
        rMap[dStr].tripCost =
          (parseFloat(rMap[dStr].tripCost) || 0) +
          (parseFloat(r.tripCost) || 0);
        rMap[dStr].promo =
          (parseFloat(rMap[dStr].promo) || 0) + (parseFloat(r.promo) || 0);
        rMap[dStr].tips =
          (parseFloat(rMap[dStr].tips) || 0) + (parseFloat(r.tips) || 0);
        rMap[dStr].tripCount =
          (parseFloat(rMap[dStr].tripCount) || 0) +
          (parseFloat(r.tripCount) || 0);
        rMap[dStr].totalHoursDec += r.totalHoursDec;
      }

      if (dStr.includes(String(currentYear))) {
        annualIncome += r.totalIncome;
        annualTime += r.totalHoursDec;
        annualTrips += parseFloat(r.tripCount) || 0;
        annualTripCost += parseFloat(r.tripCost) || 0;
        annualPromo += parseFloat(r.promo) || 0;
      }

      if (dStr === todayStr) {
        todayData.income += r.totalIncome;
        todayData.time += r.totalHoursDec;
        todayData.trips += parseFloat(r.tripCount) || 0;
        todayData.hasRecord = true;
      }

      const monthKey = dStr.substring(0, 7);
      const [yStr, mStr] = monthKey.split("-");
      const y = parseInt(yStr);
      const m = parseInt(mStr);

      if (!mData[monthKey]) {
        mData[monthKey] = {
          key: monthKey,
          year: y,
          month: m,
          totalIncome: 0,
          tripCost: 0,
          promo: 0,
          tips: 0,
          tripCount: 0,
          totalHours: 0,
          records: [],
        };
      }
      mData[monthKey].totalIncome += r.totalIncome;
      mData[monthKey].tripCost += parseFloat(r.tripCost) || 0;
      mData[monthKey].promo += parseFloat(r.promo) || 0;
      mData[monthKey].tips += parseFloat(r.tips) || 0;
      mData[monthKey].tripCount += parseFloat(r.tripCount) || 0;
      mData[monthKey].totalHours += parseFloat(r.totalHoursDec) || 0;
      mData[monthKey].records.push(r);
    });

    const annualStats = {
      year: currentYear,
      totalIncome: annualIncome,
      totalTrips: annualTrips,
      avgHourly: annualTime > 0 ? annualIncome / annualTime : 0,
      avgNetTrip: annualTrips > 0 ? annualTripCost / annualTrips : 0,
      avgGrossTrip:
        annualTrips > 0 ? (annualTripCost + annualPromo) / annualTrips : 0,
    };

    return {
      annualStats,
      todayStats: todayData,
      monthlyDataMap: mData,
      recordMap: rMap,
    };
  }, [records]);

  const currentMonthStats = useMemo(() => {
    const now = new Date();
    const currentKey = `${now.getFullYear()}-${String(
      now.getMonth() + 1
    ).padStart(2, "0")}`;
    return (
      stats.monthlyDataMap[currentKey] || {
        totalIncome: 0,
        tripCount: 0,
        totalHours: 0,
        month: now.getMonth() + 1,
      }
    );
  }, [stats.monthlyDataMap]);

  const weeklyStats = useMemo(() => {
    const base = new Date(currentWeekBase);
    base.setHours(0, 0, 0, 0);
    const diff =
      base.getDate() - base.getDay() + (base.getDay() === 0 ? -6 : 1);
    const startOfWeek = new Date(base);
    startOfWeek.setDate(diff);

    const weekNumber = getWeekNumber(startOfWeek);
    const todayStr = getLocalDateString(new Date());
    const startStr = getLocalDateString(startOfWeek);
    let endStr = "";

    const daysData = [];
    const dayLabels = ["一", "二", "三", "四", "五", "六", "日"];
    let totalIncome = 0,
      recordCount = 0,
      totalHours = 0,
      totalTrips = 0;
    let breakdown = { tripCost: 0, promo: 0, tips: 0 };

    for (let i = 0; i < 7; i++) {
      const d = new Date(startOfWeek);
      d.setDate(startOfWeek.getDate() + i);
      const dStr = getLocalDateString(d);
      if (i === 6) endStr = dStr;

      const rec = stats.recordMap[dStr];
      const dayIncome = rec ? rec.totalIncome : 0;

      daysData.push({
        date: dStr,
        dayLabel: dayLabels[i],
        income: dayIncome,
        isToday: dStr === todayStr,
      });

      if (rec) {
        totalIncome += dayIncome;
        breakdown.tripCost += parseFloat(rec.tripCost) || 0;
        breakdown.promo += parseFloat(rec.promo) || 0;
        breakdown.tips += parseFloat(rec.tips) || 0;
        totalHours += rec.totalHoursDec;
        totalTrips += parseFloat(rec.tripCount) || 0;
        recordCount++;
      }
    }

    const maxDailyIncome = Math.max(...daysData.map((d) => d.income), 100);
    const weeklyHourlyWage = totalHours > 0 ? totalIncome / totalHours : 0;
    const avgNetTripCost = totalTrips > 0 ? breakdown.tripCost / totalTrips : 0;
    const avgGrossTripCost =
      totalTrips > 0 ? (breakdown.tripCost + breakdown.promo) / totalTrips : 0;

    return {
      totalIncome,
      recordCount,
      startStr,
      endStr,
      weekNumber,
      breakdown,
      dailyData: daysData,
      maxDailyIncome,
      totalHours,
      totalTrips,
      weeklyHourlyWage,
      avgNetTripCost,
      avgGrossTripCost,
    };
  }, [stats.recordMap, currentWeekBase]);

  const recentStats = useMemo(() => {
    const today = new Date();
    const validDates = [];
    let startStr = "",
      endStr = "";
    for (let i = 1; i <= 7; i++) {
      const d = new Date();
      d.setDate(today.getDate() - i);
      const dStr = getLocalDateString(d);
      validDates.push(dStr);
      if (i === 1) endStr = dStr;
      if (i === 7) startStr = dStr;
    }

    const filteredRecords = records
      .filter((r) => validDates.includes(getLocalDateString(r.date)))
      .sort((a, b) => (a.date < b.date ? 1 : -1));
    return { records: filteredRecords, startStr, endStr };
  }, [records]);

  const currentSelectedMonthData = useMemo(() => {
    const defaultData = (key) => {
      const [y, m] = key.split("-").map(Number);
      return {
        key,
        year: y,
        month: m,
        totalIncome: 0,
        tripCost: 0,
        promo: 0,
        tips: 0,
        tripCount: 0,
        totalHours: 0,
        records: [],
        hourlyWage: 0,
        avgNetTripCost: 0,
        avgGrossTripCost: 0,
        tripsPerHour: 0,
      };
    };
    if (!selectedMonth) return null;
    const data =
      stats.monthlyDataMap[selectedMonth] || defaultData(selectedMonth);
    return {
      ...data,
      hourlyWage: data.totalHours > 0 ? data.totalIncome / data.totalHours : 0,
      avgNetTripCost: data.tripCount > 0 ? data.tripCost / data.tripCount : 0,
      avgGrossTripCost:
        data.tripCount > 0 ? (data.tripCost + data.promo) / data.tripCount : 0,
      tripsPerHour: data.totalHours > 0 ? data.tripCount / data.totalHours : 0,
    };
  }, [selectedMonth, stats.monthlyDataMap]);

  const handleWeekChange = useCallback((direction) => {
    setCurrentWeekBase((prev) => {
      const n = new Date(prev);
      n.setDate(n.getDate() + direction * 7);
      return n;
    });
  }, []);

  const goHome = useCallback(() => {
    setViewMode("weekly");
    setSelectedMonth(null);
    setCurrentWeekBase(new Date());
    setCurrentYearView(new Date().getFullYear());
  }, []);

  const fetchFromSheet = useCallback(async () => {
    if (!sheetUrl) return;
    setIsLoading(true);
    try {
      const response = await fetch(sheetUrl);
      const data = await response.json();
      if (Array.isArray(data)) {
        const processed = data.map((item) => ({
          ...item,
          tripCost: parseFloat(item.tripCost) || 0,
          promo: parseFloat(item.promo) || 0,
          tips: parseFloat(item.tips) || 0,
          totalIncome: parseFloat(item.totalIncome) || 0,
          totalHoursDec: parseFloat(item.totalHoursDec) || 0,
          tripCount: parseFloat(item.tripCount) || 0,
          hourlyWage: parseFloat(item.hourlyWage) || 0,
          tripsPerHour: parseFloat(item.tripsPerHour) || 0,
        }));
        processed.sort((a, b) => (a.date < b.date ? 1 : -1));
        setRecords(processed);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  }, [sheetUrl]);

  // Auto-sync on load
  useEffect(() => {
    if (sheetUrl) fetchFromSheet();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const income =
      (parseFloat(formData.tripCost) || 0) +
      (parseFloat(formData.promo) || 0) +
      (parseFloat(formData.tips) || 0);
    const hrs =
      (parseFloat(formData.hours) || 0) +
      (parseFloat(formData.minutes) || 0) / 60;
    const trips = parseFloat(formData.tripCount) || 0;

    const newRecord = {
      id: Date.now().toString(),
      ...formData,
      totalIncome: income,
      totalHoursDec: hrs,
      hourlyWage: hrs > 0 ? income / hrs : 0,
      tripsPerHour: hrs > 0 ? trips / hrs : 0,
      createdAt: new Date().toISOString(),
    };

    setRecords((prev) =>
      [newRecord, ...prev].sort((a, b) => (a.date < b.date ? 1 : -1))
    );
    setIsModalOpen(false);

    if (sheetUrl) {
      setIsSyncing(true);
      try {
        await fetch(sheetUrl, {
          method: "POST",
          mode: "no-cors",
          headers: { "Content-Type": "text/plain;charset=utf-8" },
          body: JSON.stringify(newRecord),
        });
      } catch (e) {
      } finally {
        setIsSyncing(false);
      }
    }
    setFormData({
      date: getLocalDateString(new Date()),
      tripCost: "",
      promo: "",
      tips: "",
      hours: "",
      minutes: "",
      tripCount: "",
    });
  };

  const handleDelete = (id) => {
    if (window.confirm("確定刪除？"))
      setRecords((prev) => prev.filter((r) => r.id !== id));
  };

  if (!isStyleLoaded) {
    return (
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "100vh",
          backgroundColor: "#f9fafb",
          color: "#10b981",
          fontFamily: "sans-serif",
          fontSize: "1.5rem",
          fontWeight: "bold",
          flexDirection: "column",
          gap: "1rem",
        }}
      >
        <div>UberTrack 載入中...</div>
        <div
          style={{
            fontSize: "0.875rem",
            color: "#9ca3af",
            fontWeight: "normal",
          }}
        >
          準備您的儀表板
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 font-sans selection:bg-emerald-200">
      <div className="bg-white px-6 pt-8 pb-10 rounded-b-[2.5rem] shadow-sm border-b border-gray-100 space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-extrabold tracking-tight text-gray-900">
            Uber<span className="text-emerald-500">Track</span>
          </h1>
          <div className="flex gap-2">
            <button
              onClick={goHome}
              className="p-2.5 rounded-full border border-gray-200 text-gray-500 hover:text-gray-900 bg-gray-50 hover:bg-gray-100 transition-all"
            >
              <Home className="w-6 h-6" />
            </button>
            <button
              onClick={() => setIsSettingsOpen(true)}
              className={`p-2.5 rounded-full border transition-all ${
                sheetUrl
                  ? "bg-emerald-50 border-emerald-200 text-emerald-600"
                  : "bg-gray-100 border-gray-200 text-gray-500"
              }`}
            >
              <Settings className="w-6 h-6" />
            </button>
          </div>
        </div>
        {!selectedMonth && viewMode !== "annual" && (
          <OverviewStats
            annualStats={stats.annualStats}
            todayStats={stats.todayStats}
          />
        )}
      </div>

      {!selectedMonth && (
        <div className="px-6 mt-[-20px] mb-6 relative z-10">
          <div className="bg-gray-100 p-1.5 rounded-xl flex border border-gray-200 shadow-lg">
            <button
              onClick={() => setViewMode("weekly")}
              className={`flex-1 py-3 text-sm font-bold rounded-lg transition-all flex items-center justify-center gap-2 ${
                viewMode === "weekly"
                  ? "bg-white text-emerald-600 shadow-sm ring-1 ring-black/5"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              <BarChart3 size={18} /> 週報表
            </button>
            <button
              onClick={() => setViewMode("monthly")}
              className={`flex-1 py-3 text-sm font-bold rounded-lg transition-all flex items-center justify-center gap-2 ${
                viewMode === "monthly"
                  ? "bg-white text-emerald-600 shadow-sm ring-1 ring-black/5"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              <PieChart size={18} /> 月報表
            </button>
            <button
              onClick={() => setViewMode("annual")}
              className={`flex-1 py-3 text-sm font-bold rounded-lg transition-all flex items-center justify-center gap-2 ${
                viewMode === "annual"
                  ? "bg-white text-emerald-600 shadow-sm ring-1 ring-black/5"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              <LineChart size={18} /> 年報表
            </button>
          </div>
        </div>
      )}

      <div className="px-5 pb-32">
        {viewMode === "weekly" && !selectedMonth && (
          <>
            <WeeklyView
              weeklyStats={weeklyStats}
              handleWeekChange={handleWeekChange}
            />
            <RecentRecordList
              recentStats={recentStats}
              sheetUrl={sheetUrl}
              fetchFromSheet={fetchFromSheet}
              isLoading={isLoading}
              handleDelete={handleDelete}
            />
          </>
        )}
        {viewMode === "monthly" && (
          <MonthlyView
            selectedMonth={selectedMonth}
            setSelectedMonth={setSelectedMonth}
            currentYearView={currentYearView}
            setCurrentYearView={setCurrentYearView}
            monthlyDataMap={stats.monthlyDataMap}
            currentSelectedMonthData={currentSelectedMonthData}
            currentMonthStats={currentMonthStats}
          />
        )}
        {viewMode === "annual" && (
          <AnnualView
            currentYearView={currentYearView}
            setCurrentYearView={setCurrentYearView}
            monthlyDataMap={stats.monthlyDataMap}
            annualStats={stats.annualStats}
          />
        )}
      </div>

      {!selectedMonth && (
        <button
          onClick={() => setIsModalOpen(true)}
          className="fixed bottom-8 right-6 w-16 h-16 bg-emerald-500 hover:bg-emerald-400 text-white rounded-full shadow-[0_8px_30px_rgb(16,185,129,0.4)] flex items-center justify-center transition-transform active:scale-95 z-50 border-4 border-white"
        >
          <Plus size={32} strokeWidth={3} />
        </button>
      )}

      {/* Simplified Modals logic kept similar for brevity but organized */}
      {isSettingsOpen && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-gray-900/50 backdrop-blur-sm"
            onClick={() => setIsSettingsOpen(false)}
          ></div>
          <div className="relative bg-white w-full max-w-sm rounded-3xl border border-gray-100 p-6 shadow-2xl">
            <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
              <CloudLightning className="text-emerald-500" />
              雲端資料庫
            </h3>
            <p className="text-sm text-gray-500 mb-4">
              {FIXED_SHEET_URL ? (
                <span className="text-emerald-600 font-bold bg-emerald-50 px-2 py-1 rounded">
                  ● 已啟用內建固定網址
                </span>
              ) : (
                "輸入網址"
              )}
            </p>
            <input
              type="text"
              defaultValue={sheetUrl}
              onBlur={(e) => {
                try {
                  setSheetUrl(e.target.value);
                  localStorage.setItem("uber_sheet_url", e.target.value);
                } catch (err) {}
              }}
              disabled={!!FIXED_SHEET_URL}
              className={`w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-emerald-600 text-xs mb-4 focus:outline-none focus:border-emerald-500 ${
                FIXED_SHEET_URL ? "opacity-60 cursor-not-allowed" : ""
              }`}
            />
            {sheetUrl && (
              <button
                onClick={fetchFromSheet}
                className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold text-sm py-3 rounded-xl transition-colors flex items-center justify-center gap-2"
              >
                <DownloadCloud size={16} /> 立即下載資料
              </button>
            )}
            <button
              onClick={() => setIsSettingsOpen(false)}
              className="w-full mt-4 bg-gray-900 hover:bg-gray-800 text-white font-bold py-3 rounded-xl transition-colors shadow-lg"
            >
              完成
            </button>
          </div>
        </div>
      )}

      {isModalOpen && (
        <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center">
          <div
            className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm"
            onClick={() => setIsModalOpen(false)}
          ></div>
          <div className="relative bg-white w-full sm:w-[450px] sm:rounded-3xl rounded-t-[2rem] border-t sm:border border-gray-200 p-8 shadow-2xl animate-in slide-in-from-bottom duration-300">
            <div className="flex justify-between items-center mb-8">
              <h3 className="text-2xl font-black text-gray-900">新增紀錄</h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-2 bg-gray-100 rounded-full text-gray-500 hover:text-gray-900"
              >
                <X size={24} />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <label className="text-sm font-bold text-gray-500 uppercase tracking-wider ml-1">
                  日期
                </label>
                <div className="relative">
                  <input
                    required
                    type="date"
                    name="date"
                    value={formData.date}
                    onChange={(e) =>
                      setFormData((p) => ({ ...p, date: e.target.value }))
                    }
                    className="w-full bg-gray-50 border border-gray-200 rounded-2xl px-5 py-4 text-gray-900 text-lg font-bold focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 transition-all"
                  />
                  <Calendar
                    className="absolute right-5 top-4.5 text-gray-400 pointer-events-none"
                    size={24}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-bold text-gray-500 uppercase tracking-wider ml-1">
                  收入詳情
                </label>
                <div className="grid grid-cols-3 gap-3">
                  <div className="relative">
                    <input
                      type="number"
                      placeholder="0"
                      name="tripCost"
                      value={formData.tripCost}
                      onChange={(e) =>
                        setFormData((p) => ({ ...p, tripCost: e.target.value }))
                      }
                      className="w-full bg-gray-50 border border-gray-200 rounded-2xl pl-4 pr-2 py-4 text-gray-900 text-base font-bold focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                    />
                    <span className="absolute text-[10px] text-gray-400 top-2 right-3 font-bold">
                      行程
                    </span>
                  </div>
                  <div className="relative">
                    <input
                      type="number"
                      placeholder="0"
                      name="promo"
                      value={formData.promo}
                      onChange={(e) =>
                        setFormData((p) => ({ ...p, promo: e.target.value }))
                      }
                      className="w-full bg-gray-50 border border-gray-200 rounded-2xl pl-4 pr-2 py-4 text-gray-900 text-base font-bold focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                    />
                    <span className="absolute text-[10px] text-gray-400 top-2 right-3 font-bold">
                      獎勵
                    </span>
                  </div>
                  <div className="relative">
                    <input
                      type="number"
                      placeholder="0"
                      name="tips"
                      value={formData.tips}
                      onChange={(e) =>
                        setFormData((p) => ({ ...p, tips: e.target.value }))
                      }
                      className="w-full bg-gray-50 border border-gray-200 rounded-2xl pl-4 pr-2 py-4 text-gray-900 text-base font-bold focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                    />
                    <span className="absolute text-[10px] text-gray-400 top-2 right-3 font-bold">
                      小費
                    </span>
                  </div>
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-bold text-gray-500 uppercase tracking-wider ml-1">
                  工時
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <div className="relative">
                    <input
                      required
                      type="number"
                      placeholder="0"
                      name="hours"
                      value={formData.hours}
                      onChange={(e) =>
                        setFormData((p) => ({ ...p, hours: e.target.value }))
                      }
                      className="w-full bg-gray-50 border border-gray-200 rounded-2xl px-5 py-4 text-gray-900 text-lg font-bold focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                    />
                    <span className="absolute right-5 top-5 text-gray-400 text-sm font-bold">
                      時
                    </span>
                  </div>
                  <div className="relative">
                    <input
                      type="number"
                      placeholder="0"
                      name="minutes"
                      max="59"
                      value={formData.minutes}
                      onChange={(e) =>
                        setFormData((p) => ({ ...p, minutes: e.target.value }))
                      }
                      className="w-full bg-gray-50 border border-gray-200 rounded-2xl px-5 py-4 text-gray-900 text-lg font-bold focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                    />
                    <span className="absolute right-5 top-5 text-gray-400 text-sm font-bold">
                      分
                    </span>
                  </div>
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-bold text-gray-500 uppercase tracking-wider ml-1">
                  趟數
                </label>
                <div className="relative">
                  <input
                    required
                    type="number"
                    placeholder="例如: 15"
                    name="tripCount"
                    value={formData.tripCount}
                    onChange={(e) =>
                      setFormData((p) => ({ ...p, tripCount: e.target.value }))
                    }
                    className="w-full bg-gray-50 border border-gray-200 rounded-2xl px-5 py-4 text-gray-900 text-lg font-bold focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                  />
                  <Bike
                    className="absolute right-5 top-4.5 text-gray-400"
                    size={24}
                  />
                </div>
              </div>
              <button
                type="submit"
                disabled={isSyncing}
                className="w-full bg-emerald-500 hover:bg-emerald-400 text-white font-black text-lg py-5 rounded-2xl shadow-xl shadow-emerald-500/30 transition-all active:scale-[0.98] mt-4 flex items-center justify-center gap-2"
              >
                {isSyncing ? (
                  <CloudLightning className="animate-pulse" size={24} />
                ) : (
                  "儲存紀錄"
                )}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
