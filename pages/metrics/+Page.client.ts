import { useState, createElement } from "react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import ReactECharts from "echarts-for-react";
import { Footer } from "~/components";
import styles from "./main.module.sass";
import { useData } from "vike-react/useData";
import { Switch } from "@blueprintjs/core";

function h(type: any, propsOrChildren?: any, ...children: any[]) {
  /**
   * A smart hyperscript wrapper around React.createElement.
   * It automatically injects `null` when props are omitted and flattens
   * nested arrays of children. This allows us to write clean h() syntax
   * without triggering React's strict "missing key" warnings for static lists.
   */
  const flatChildren = children.flat(Infinity);

  if (
    typeof propsOrChildren === "string" ||
    typeof propsOrChildren === "number" ||
    Array.isArray(propsOrChildren) ||
    propsOrChildren?.$$typeof
  ) {
    const allChildren = [propsOrChildren, ...flatChildren].flat(Infinity);
    return createElement(type, null, ...allChildren);
  }

  return createElement(type, propsOrChildren, ...flatChildren);
}

function getDateFromYearAndWeek(year: number, week: number): Date {
  /**
   * Calculates a standard JavaScript Date object representing the
   * first day (Monday) of a given ISO year and week number.
   */
  const firstDayOfYear = new Date(year, 0, 1);
  const daysToAdd = (week - 1) * 7;

  const firstMonday =
    firstDayOfYear.getDay() <= 1
      ? firstDayOfYear
      : new Date(year, 0, 1 + (8 - firstDayOfYear.getDay()));

  const targetDate = new Date(firstMonday);
  targetDate.setDate(firstMonday.getDate() + daysToAdd);

  return targetDate;
}

export function Page() {
  // Define default boundaries for the graphs (defaulting to the past 1 year)
  let currentDate = new Date();
  let lower = new Date();
  lower.setFullYear(currentDate.getFullYear() - 1);
  let upper = new Date();

  const [checkinBound, setCheckin] = useState([lower, upper]);
  const [signupBound, setSignup] = useState([lower, upper]);
  const [activeBound, setActive] = useState([lower, upper]);
  const [showBar, setShowBar] = useState(false);

  // Fetch the data injected by from the api/v2/metrics/ api
  const { data } = useData();

  interface InputData {
    year: number;
    week: number;
    count: string;
  }

  interface TransformedData {
    name: string;
    Total: number;
  }

  const checkins_by_week: TransformedData[] = [];
  const checkins_by_month: TransformedData[] = [];
  const signups_by_week: TransformedData[] = [];
  const signups_by_month: TransformedData[] = [];
  const active_users_by_week: TransformedData[] = [];
  const active_users_by_month: TransformedData[] = [];

  let currentMonth = currentDate.getMonth(); // 0-indexed (May = 4)
  let currentYear = currentDate.getFullYear();
  let days = new Date(currentYear, currentMonth + 1, 0).getDate();
  let date = currentDate.getDate();
  let scale = days / date;

  // Create a label for the current month (e.g., "5/26") to verify before scaling
  const currentMonthLabel = `${currentMonth + 1}/${String(currentYear).slice(
    -2
  )}`;

  // --- CHECKINS ---
  // Process weekly checkins: Filter by user-selected date bounds and ignore future dates
  for (const item of data?.checkins_by_week || []) {
    let tempDate = getDateFromYearAndWeek(item.year, item.week);
    if (
      checkinBound[0] <= tempDate &&
      tempDate <= checkinBound[1] &&
      tempDate <= currentDate
    ) {
      checkins_by_week.push({
        name: `${item.year}-W${item.week}`,
        Total: parseInt(item.count),
      });
    }
  }
  // Process monthly checkins: Ignore future dates returned by the API
  for (const item of data?.checkins_by_month || []) {
    let itemDate = new Date(item.year, item.month - 1, 1);
    if (itemDate <= currentDate) {
      checkins_by_month.push({
        name: `${item.month}/${String(item.year).slice(-2)}`,
        Total: parseInt(item.count),
      });
    }
  }
  // If the last data point is the current month, apply the estimation scale
  if (checkins_by_month.length > 0) {
    let last = checkins_by_month.length - 1;
    if (checkins_by_month[last].name === currentMonthLabel) {
      checkins_by_month[last].Total = Math.round(
        checkins_by_month[last].Total * scale
      );
      checkins_by_month[last].name += ` (est)`;
    }
  }

  // --- SIGNUPS ---
  for (const item of data?.signups_by_week || []) {
    let tempDate = getDateFromYearAndWeek(item.year, item.week);
    if (
      signupBound[0] <= tempDate &&
      tempDate <= signupBound[1] &&
      tempDate <= currentDate
    ) {
      signups_by_week.push({
        name: `${item.year}-W${item.week}`,
        Total: parseInt(item.count),
      });
    }
  }

  for (const item of data?.signups_by_month || []) {
    let itemDate = new Date(item.year, item.month - 1, 1);
    if (itemDate <= currentDate) {
      signups_by_month.push({
        name: `${item.month}/${String(item.year).slice(-2)}`,
        Total: parseInt(item.count),
      });
    }
  }

  if (signups_by_month.length > 0) {
    let last = signups_by_month.length - 1;
    if (signups_by_month[last].name === currentMonthLabel) {
      signups_by_month[last].Total = Math.round(
        signups_by_month[last].Total * scale
      );
      signups_by_month[last].name += ` (est)`;
    }
  }

  // --- ACTIVE USERS ---
  for (const item of data?.active_users_by_week || []) {
    let tempDate = getDateFromYearAndWeek(item.year, item.week);
    if (
      activeBound[0] <= tempDate &&
      tempDate <= activeBound[1] &&
      tempDate <= currentDate
    ) {
      active_users_by_week.push({
        name: `${item.year}-W${item.week}`,
        Total: parseInt(item.count),
      });
    }
  }

  for (const item of data?.active_users_by_month || []) {
    let itemDate = new Date(item.year, item.month - 1, 1);
    if (itemDate <= currentDate) {
      active_users_by_month.push({
        name: `${item.month}/${String(item.year).slice(-2)}`,
        Total: parseInt(item.count),
      });
    }
  }

  if (active_users_by_month.length > 0) {
    let last = active_users_by_month.length - 1;
    if (active_users_by_month[last].name === currentMonthLabel) {
      active_users_by_month[last].Total = Math.round(
        active_users_by_month[last].Total * scale
      );
      active_users_by_month[last].name += ` (est)`;
    }
  }

  function renderChart(chartData: TransformedData[]) {
    /**
     * Helper function to build and render an Apache ECharts (recharts had child rendering issues).
     * Maps formatted data into an options dictionary, smoothing line charts
     * and dynamically responding to the `showBar` toggle state.
     */
    const xData = chartData.map((d) => d.name);
    const yData = chartData.map((d) => d.Total);

    const option = {
      tooltip: {
        trigger: "axis",
        backgroundColor: "rgba(255, 255, 255, 0.9)",
      },
      grid: {
        top: 20,
        right: 30,
        bottom: 30,
        left: 50,
      },
      xAxis: {
        type: "category",
        data: xData,
        axisLabel: { color: "var(--text-emphasized-color)" },
        axisLine: { lineStyle: { color: "var(--text-emphasized-color)" } },
      },
      yAxis: {
        type: "value",
        axisLabel: { color: "var(--text-emphasized-color)" },
        splitLine: {
          lineStyle: { type: "dashed", color: "rgba(150, 150, 150, 0.3)" },
        },
      },
      series: [
        {
          data: yData,
          type: showBar ? "bar" : "line",
          smooth: true,
          areaStyle: showBar ? undefined : { color: "#8884d8", opacity: 0.5 },
          itemStyle: { color: "#8884d8" },
          lineStyle: { color: "#8884d8" },
        },
      ],
    };

    return h(ReactECharts, {
      option: option,
      style: { height: "300px", width: "100%" },
      notMerge: true,
    });
  }

  return h("div", { className: styles.container }, [
    h(Switch, {
      className: styles.switch,
      checked: showBar,
      label: "Show bar charts",
      onChange: () => setShowBar(!showBar),
    }),
    h("div", { className: styles.metrics }, [
      h("div", null, [h("h1", "Metrics")]),
      h("div", { className: styles.summary }, [
        h("div", null, [
          h("h2", "Total Users"),
          h("p", numberWithCommas(data?.summary?.people || 0)),
        ]),
        h("div", null, [
          h("h2", "Active Users"),
          h("p", numberWithCommas(data?.summary?.active_people || 0)),
        ]),
        h("div", null, [
          h("h2", "Avid Users (>5)"),
          h("p", numberWithCommas(data?.summary?.avid_people || 0)),
        ]),
        h("div", null, [
          h("h2", "Checkins"),
          h("p", numberWithCommas(data?.summary?.checkins || 0)),
        ]),
        h("div", null, [
          h("h2", "Observations"),
          h("p", numberWithCommas(data?.summary?.observations || 0)),
        ]),
        h("div", null, [
          h("h2", "Photos"),
          h("p", numberWithCommas(data?.summary?.photos || 0)),
        ]),
      ]),
      h("div", { className: styles.graphs }, [
        h("div", null, [
          h("h2", "Checkins by week"),
          renderChart(checkins_by_week),
          h("div", { className: styles["date-picker"] }, [
            h("p", "Select date range:"),
            h(DatePicker, {
              className: styles.picker,
              selected: checkinBound[0],
              onChange: (date: Date) => setCheckin([date, checkinBound[1]]),
            }),
            h("p", "to"),
            h(DatePicker, {
              className: styles.picker,
              selected: checkinBound[1],
              onChange: (date: Date) => setCheckin([checkinBound[0], date]),
            }),
          ]),
        ]),
        h("div", null, [
          h("h2", "Checkins by month"),
          renderChart(checkins_by_month),
        ]),
        h("div", null, [
          h("h2", "Signups by week"),
          renderChart(signups_by_week),
          h("div", { className: styles["date-picker"] }, [
            h("p", "Select date range:"),
            h(DatePicker, {
              className: styles.picker,
              selected: signupBound[0],
              onChange: (date: Date) => setSignup([date, signupBound[1]]),
            }),
            h("p", "to"),
            h(DatePicker, {
              className: styles.picker,
              selected: signupBound[1],
              onChange: (date: Date) => setSignup([signupBound[0], date]),
            }),
          ]),
        ]),
        h("div", null, [
          h("h2", "Signups by month"),
          renderChart(signups_by_month),
        ]),
        h("div", null, [
          h("h2", "Active Users by week"),
          renderChart(active_users_by_week),
          h("div", { className: styles["date-picker"] }, [
            h("p", "Select date range:"),
            h(DatePicker, {
              className: styles.picker,
              selected: activeBound[0],
              onChange: (date: Date) => setActive([date, activeBound[1]]),
            }),
            h("p", "to"),
            h(DatePicker, {
              className: styles.picker,
              selected: activeBound[1],
              onChange: (date: Date) => setActive([activeBound[0], date]),
            }),
          ]),
        ]),
        h("div", null, [
          h("h2", "Active Users by month"),
          renderChart(active_users_by_month),
        ]),
      ]),
    ]),
    h(Footer),
  ]);
}

function numberWithCommas(x: number | string) {
  if (x == null) return "0";
  return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}
