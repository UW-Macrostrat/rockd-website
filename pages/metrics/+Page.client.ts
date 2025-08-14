import { useState } from 'react';
import DatePicker from "react-datepicker";
import {
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Area,
    AreaChart,
    Bar,
    BarChart,
    ResponsiveContainer,
  } from "recharts";
import { Footer } from "~/components/general";
import h from "./main.module.sass";
import { useData } from "vike-react/useData";
import { Switch } from '@blueprintjs/core';


function getDateFromYearAndWeek(year: number, week: number): Date {
    const firstDayOfYear = new Date(year, 0, 1);
    const daysToAdd = (week - 1) * 7; // Calculate days to add for the given week

    // Get the first Monday of the year
    const firstMonday = firstDayOfYear.getDay() <= 1 ? firstDayOfYear : new Date(year, 0, 1 + (8 - firstDayOfYear.getDay()));

    // Calculate the date of the first day of the given week
    const targetDate = new Date(firstMonday);
    targetDate.setDate(firstMonday.getDate() + daysToAdd);

    return targetDate;
}

export function Page() {
    let currentDate = new Date(); // Get today's date
    let lower = new Date();
    lower.setFullYear(currentDate.getFullYear() - 1);
    let upper = new Date();

    const [checkinBound, setCheckin] = useState([lower, upper]);    
    const [signupBound, setSignup] = useState([lower, upper]);
    const [activeBound, setActive] = useState([lower, upper]);
    const [showBar, setShowBar] = useState(false);

    // new API doesn't return all data
    const { data } = useData();

    // format data
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
    let currentMonth = currentDate.getMonth(); // Get current month (0-based)
    let currentYear = currentDate.getFullYear(); // Get current year
    let days = new Date(currentYear, currentMonth + 1, 0).getDate();
    let date = new Date().getDate();
    let scale = days / date;
    let currentTotal;
    let currentName;
    let tempDate;

    // checkins by week
    for (const item of data.checkins_by_week) {
        tempDate = getDateFromYearAndWeek(item.year, item.week);

        if(checkinBound[0] <= tempDate && tempDate <= checkinBound[1]) {
            checkins_by_week.push({
                name: `${item.year}-W${item.week}`, 
                Total: parseInt(item.count)
            });
        }
    }

    // checkins by month
    for (const item of data.checkins_by_month) {
        checkins_by_month.push({
            name: `${item.month}/${String(item.year).slice(-2)}`, 
            Total: parseInt(item.count)
        });
    }
    checkins_by_month.pop();      
    currentTotal = checkins_by_month[checkins_by_month.length - 1].Total;
    currentName = checkins_by_month[checkins_by_month.length - 1].name;
    checkins_by_month[checkins_by_month.length - 1].Total = Math.round(currentTotal * scale);
    checkins_by_month[checkins_by_month.length - 1].name = currentName + ` (est)`;

    // sign ups by week
    for (const item of data.signups_by_week) {
        tempDate = getDateFromYearAndWeek(item.year, item.week);

        if(signupBound[0] <= tempDate && tempDate <= signupBound[1]) {
            signups_by_week.push({
                name: `${item.year}-W${item.week}`, 
                Total: parseInt(item.count)
            });
        }
    }

    // sign ups by month
    for (const item of data.signups_by_month) {
        signups_by_month.push({
            name: `${item.month}/${String(item.year).slice(-2)}`,
            Total: parseInt(item.count) 
        });
    }  
    signups_by_month.pop();
    currentTotal = signups_by_month[signups_by_month.length - 1].Total;
    currentName = signups_by_month[signups_by_month.length - 1].name;
    signups_by_month[signups_by_month.length - 1].Total = Math.round(currentTotal * scale);
    signups_by_month[signups_by_month.length - 1].name = currentName + ` (est)`;

    for (const item of data.active_users_by_week) {
        tempDate = getDateFromYearAndWeek(item.year, item.week);

        if(activeBound[0] <= tempDate && tempDate <= activeBound[1]) {
            active_users_by_week.push({
                name: `${item.year}-W${item.week}`, 
                Total: parseInt(item.count)
            });
        }
    }

    for (const item of data.active_users_by_month) {
        active_users_by_month.push({
            name: `${item.month}/${String(item.year).slice(-2)}`, 
            Total: parseInt(item.count)
        });
    }     
    active_users_by_month.pop();
    currentTotal = active_users_by_month[active_users_by_month.length - 1].Total;
    currentName = active_users_by_month[active_users_by_month.length - 1].name;
    active_users_by_month[active_users_by_month.length - 1].Total = Math.round(currentTotal * scale);
    active_users_by_month[active_users_by_month.length - 1].name = currentName + ` (est)`;

    console.log("Scaled the month: ", currentName)

    // chart array
    const areaArr = [
        h(CartesianGrid, { strokeDasharray: "3 3" }),
        h(XAxis, { dataKey: "name", stroke: "var(--text-emphasized-color)" }),
        h(YAxis, { stroke: "var(--text-emphasized-color)" }),
        h(Tooltip),
        h(Area, { type: "monotone", dataKey: "Total", stroke: "#8884d8", fill: "#8884d8" }),
    ]

    const barArr = [
        h(CartesianGrid, { strokeDasharray: "3 3" }),
        h(XAxis, { dataKey: "name", stroke: "var(--text-emphasized-color)" }),
        h(YAxis, { stroke: "var(--text-emphasized-color)" }),
        h(Tooltip),
        h(Bar, { dataKey: "Total", fill: "#8884d8" }),
    ];

    const arr = showBar ? barArr : areaArr;
    const ChartComponent = showBar ? BarChart : AreaChart;

    return h('div', { className: "container" }, [
        h(Switch, {
            className: "switch",
            value: showBar,
            label: "Show bar charts",
            onChange: () => setShowBar(!showBar)
        }),
        h("div", { className: 'metrics' }, [
            h("div", { className: 'header' }, [
                h("h1", "Metrics"),
            ]),
            h("div", { className: 'summary' }, [
                h("div", { className: 'stat' }, [
                    h("h2", "Total Users"),
                    h("p", numberWithCommas(data.summary.people))
                ]),
                h("div", { className: 'stat' }, [
                    h("h2", "Active Users"),
                    h("p", numberWithCommas(data.summary.active_people))
                ]),
                h("div", { className: 'stat' }, [
                    h("h2", "Avid Users (>5)"),
                    h("p", numberWithCommas(data.summary.avid_people))
                ]),
                h("div", { className: 'stat' }, [
                    h("h2", "Checkins"),
                    h("p", numberWithCommas(data.summary.checkins))
                ]),
                h("div", { className: 'stat' }, [
                    h("h2", "Observations"),
                    h("p", numberWithCommas(data.summary.observations))
                ]),
                h("div", { className: 'stat' }, [
                    h("h2", "Photos"),
                    h("p",numberWithCommas( data.summary.photos))
                ]),
            ]),
            h("div", { className: 'graphs' }, [
                h("div", { className: 'checkins_week' }, [
                    h("h2", "Checkins by week"),
                    h(ResponsiveContainer, { width: "100%", height: 300 }, [
                        h(ChartComponent, { className: "chart", data: checkins_by_week }, arr),
                    ]),
                    h('div', { className: 'date-picker' }, [
                        h('p', 'Select date range:'),
                        h(DatePicker, { className: 'picker', selected: checkinBound[0], onChange: (date) => setCheckin([date, checkinBound[1]]) }),
                        h('p', 'to'),
                        h(DatePicker, { className: 'picker', selected: checkinBound[1], onChange: (date) => setCheckin([checkinBound[0], date]) }),
                    ]),
                ]),
                h("div", { className: 'checkins_month' }, [
                    h("h2", "Checkins by month"),
                    h(ResponsiveContainer, { width: "100%", height: 300 }, [
                        h(ChartComponent, { className: "chart", data: checkins_by_month }, arr)
                    ]),
                ]),
                h("div", { className: 'signups_week' }, [
                    h("h2", "Signups by week"),
                    h(ResponsiveContainer, { width: "100%", height: 300 }, [
                        h(ChartComponent, { className: "chart", data: signups_by_week }, arr),
                    ]),
                    h('div', { className: 'date-picker' }, [
                        h('p', 'Select date range:'),
                        h(DatePicker, { className: 'picker', selected: signupBound[0], onChange: (date) => setSignup([date, signupBound[1]]) }),
                        h('p', 'to'),
                        h(DatePicker, { className: 'picker', selected: signupBound[1], onChange: (date) => setSignup([signupBound[0], date]) }),
                    ]),
                ]),
                h("div", { className: 'signups_month' }, [
                    h("h2", "Signups by month"),
                    h(ResponsiveContainer, { width: "100%", height: 300 }, [
                        h(ChartComponent, { className: "chart", data: signups_by_month }, arr)
                    ]),
                ]),
                h("div", { className: 'users_week' }, [
                    h("h2", "Active Users by week"),
                    h(ResponsiveContainer, { width: "100%", height: 300 }, [
                        h(ChartComponent, { className: "chart", data: active_users_by_week }, arr),
                    ]),
                    h('div', { className: 'date-picker' }, [
                        h('p', 'Select date range:'),
                        h(DatePicker, { className: 'picker', selected: activeBound[0], onChange: (date) => setActive([date, activeBound[1]]) }),
                        h('p', 'to'),
                        h(DatePicker, { className: 'picker', selected: activeBound[1], onChange: (date) => setActive([activeBound[0], date]) }),
                    ]),
                ]),
                h("div", { className: 'users_month' }, [
                    h("h2", "Active Users by month"),
                    h(ResponsiveContainer, { width: "100%", height: 300 }, [
                        h(ChartComponent, { className: "chart", data: active_users_by_month }, arr)
                    ]),
                ]),
            ])
        ]),
        h(Footer)
    ])
}


function numberWithCommas(x) {
    return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}