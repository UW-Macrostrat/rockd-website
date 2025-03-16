import h from "@macrostrat/hyper";
import { useEffect, useState, PureComponent } from 'react';
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import {
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Area,
    AreaChart,
    ResponsiveContainer,
  } from "recharts";
import { apiURLOld, Footer, useRockdAPI } from "../index";
import "./main.sass";
import "../main.sass";
import { DarkModeButton, useAPIResult } from "@macrostrat/ui-components";

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

    // new API doesn't return all data
    const userData = useAPIResult(apiURLOld + "metrics");

    if (!userData) {
        return h("div", { className: 'loading' }, [
            h("p", null, "Loading...")
        ]);
    }

    const data = userData.success.data;

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
    let areaArr = [
        h(CartesianGrid, { strokeDasharray: "3 3" }),
        h(XAxis, { dataKey: "name" }),
        h(YAxis),
        h(Tooltip),
        h(Area, { type: "monotone", dataKey: "Total", stroke: "#8884d8", fill: "#8884d8" }),
    ]

    return h('div', [
        h("div", { className: 'metrics' }, [
            h("div", { className: 'header' }, [
                h("h1", "Metrics"),
                h(DarkModeButton, { className: 'dark-mode-btn', showText: true }),
            ]),
            h("div", { className: 'summary' }, [
                h("div", { className: 'stat' }, [
                    h("h2", "Total Users"),
                    h("p", data.summary.people)
                ]),
                h("div", { className: 'stat' }, [
                    h("h2", "Active Users"),
                    h("p", data.summary.active_people)
                ]),
                h("div", { className: 'stat' }, [
                    h("h2", "Avid Users (>5)"),
                    h("p", data.summary.avid_people)
                ]),
                h("div", { className: 'stat' }, [
                    h("h2", "Checkins"),
                    h("p", data.summary.checkins)
                ]),
                h("div", { className: 'stat' }, [
                    h("h2", "Observations"),
                    h("p", data.summary.observations)
                ]),
                h("div", { className: 'stat' }, [
                    h("h2", "Photos"),
                    h("p", data.summary.photos)
                ]),
            ]),
            h("div", { className: 'graphs' }, [
                h("div", { className: 'checkins_week' }, [
                    h("h2", "Checkins by week"),
                    h(ResponsiveContainer, { width: "100%", height: 300 }, [
                        h(AreaChart, { className: "chart", data: checkins_by_week }, areaArr),
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
                        h(AreaChart, { className: "chart", data: checkins_by_month }, areaArr)
                    ]),
                ]),
                h("div", { className: 'signups_week' }, [
                    h("h2", "Signups by week"),
                    h(ResponsiveContainer, { width: "100%", height: 300 }, [
                        h(AreaChart, { className: "chart", data: signups_by_week }, areaArr),
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
                        h(AreaChart, { className: "chart", data: signups_by_month }, areaArr)
                    ]),
                ]),
                h("div", { className: 'users_week' }, [
                    h("h2", "Active Users by week"),
                    h(ResponsiveContainer, { width: "100%", height: 300 }, [
                        h(AreaChart, { className: "chart", data: active_users_by_week }, areaArr),
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
                        h(AreaChart, { className: "chart", data: active_users_by_month }, areaArr)
                    ]),
                ]),
            ])
        ]),
        h(Footer)
    ])
}