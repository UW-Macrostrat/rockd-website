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
  } from "recharts";

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

export function Metrics() {
    let currentDate = new Date(); // Get today's date
    let lower = new Date();
    lower.setFullYear(currentDate.getFullYear() - 1);
    let upper = new Date();

    const [userData, setUserData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [checkinBound, setCheckin] = useState([lower, upper]);    
    const [signupBound, setSignup] = useState([lower, upper]);
    const [activeBound, setActive] = useState([lower, upper]);

    useEffect(() => {
        fetch("https://rockd.org/api/v2/metrics")
            .then(response => {
                if (!response.ok) {
                    throw new Error('Network response was not ok');
                }
                return response.json();
            })
            .then(data => {
                console.log('Fetched data:', data); // Log fetched data for debugging
                setUserData(data);
            })
            .catch(error => {
                console.error('Fetch error:', error);
                setError(error.message);
            })
            .finally(() => {
                setLoading(false);
            });
    }, []);

    if (loading) {
        return h("div", { className: 'loading' }, [
            h("p", null, "Loading...")
        ]);
    }

    if (error) {
        return h("div", { className: 'error' }, [
            h("h1", "Error"),
            h("p", error)
        ]);
    }

    if (!userData) {
        return h("div", { className: 'error' }, [
            h("h1", "No data found"),  
        ]);
    }

    let data = userData.success.data;

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
    currentTotal = active_users_by_month[active_users_by_month.length - 1].Total;
    currentName = active_users_by_month[active_users_by_month.length - 1].name;
    active_users_by_month[active_users_by_month.length - 1].Total = Math.round(currentTotal * scale);
    active_users_by_month[active_users_by_month.length - 1].name = currentName + ` (est)`;

    // chart array
    let areaArr = [
        h(CartesianGrid, { strokeDasharray: "3 3" }),
        h(XAxis, { dataKey: "name" }),
        h(YAxis),
        h(Tooltip),
        h(Area, { type: "monotone", dataKey: "Total", stroke: "#8884d8", fill: "#8884d8" }),
    ]

    return h("div", { className: 'metrics' }, [
        h("h1", "Metrics"),
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
                h(AreaChart, { className: "chart", width: 500, height: 300, data: checkins_by_week }, areaArr),
                h('div', { className: 'date-picker' }, [
                    h('p', 'Select date range:'),
                    h(DatePicker, { className: 'picker', selected: checkinBound[0], onChange: (date) => setCheckin([date, checkinBound[1]]) }),
                    h('p', 'to'),
                    h(DatePicker, { className: 'picker', selected: checkinBound[1], onChange: (date) => setCheckin([checkinBound[0], date]) }),
                ]),
            ]),
            h("div", { className: 'checkins_month' }, [
                h("h2", "Checkins by month"),
                h(AreaChart, { className: "chart", width: 500, height: 300, data: checkins_by_month }, areaArr)
            ]),
            h("div", { className: 'signups_week' }, [
                h("h2", "Signups by week"),
                h(AreaChart, { className: "chart", width: 500, height: 300, data: signups_by_week }, areaArr),
                h('div', { className: 'date-picker' }, [
                    h('p', 'Select date range:'),
                    h(DatePicker, { className: 'picker', selected: signupBound[0], onChange: (date) => setSignup([date, signupBound[1]]) }),
                    h('p', 'to'),
                    h(DatePicker, { className: 'picker', selected: signupBound[1], onChange: (date) => setSignup([signupBound[0], date]) }),
                ]),
            ]),
            h("div", { className: 'signups_month' }, [
                h("h2", "Signups by month"),
                h(AreaChart, { className: "chart", width: 500, height: 300, data: signups_by_month }, areaArr)
            ]),
            h("div", { className: 'users_week' }, [
                h("h2", "Active Users by week"),
                h(AreaChart, { className: "chart", width: 500, height: 300, data: active_users_by_week }, areaArr),
                h('div', { className: 'date-picker' }, [
                    h('p', 'Select date range:'),
                    h(DatePicker, { className: 'picker', selected: activeBound[0], onChange: (date) => setActive([date, activeBound[1]]) }),
                    h('p', 'to'),
                    h(DatePicker, { className: 'picker', selected: activeBound[1], onChange: (date) => setActive([activeBound[0], date]) }),
                ]),
            ]),
            h("div", { className: 'users_month' }, [
                h("h2", "Active Users by month"),
                h(AreaChart, { className: "chart", width: 500, height: 300, data: active_users_by_month }, areaArr)
            ]),
        ])
    ]);
}