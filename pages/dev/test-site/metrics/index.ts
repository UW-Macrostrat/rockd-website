import h from "@macrostrat/hyper";
import React, { useMemo, useEffect, useState, useRef } from 'react';

import { Bar } from '@visx/shape';
import { Group } from '@visx/group';
import { GradientTealBlue } from '@visx/gradient';
import { scaleBand, scaleLinear } from '@visx/scale';
import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    Area,
    AreaChart,
  } from "recharts";


export function Example() {
    return h(Bar, { x: 0, y: 0, width: 100, height: 100, fill: "red" });
}

export function Metrics() {
    const [userData, setUserData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);


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
    let currentDate = new Date(); // Get today's date
    let currentMonth = currentDate.getMonth(); // Get current month (0-based)
    let currentYear = currentDate.getFullYear(); // Get current year
    let days = new Date(currentYear, currentMonth + 1, 0).getDate();
    let date = new Date().getDate();
    let scale = days / date;
    let currentTotal;
    let currentName;

    for (const item of data.checkins_by_week) {
        checkins_by_week.push({
            name: `${item.year}-W${item.week}`, 
            Total: parseInt(item.count)
        });
    }
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

    for (const item of data.signups_by_week) {
        signups_by_week.push({
            name: `${item.year}-W${item.week}`,
            Total: parseInt(item.count) 
        });
    }
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
        active_users_by_week.push({
            name: `${item.year}-W${item.week}`,
            Total: parseInt(item.count)
        });
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
                h(AreaChart, { className: "chart", width: 500, height: 300, data: checkins_by_week }, areaArr)
            ]),
            h("div", { className: 'checkins_month' }, [
                h("h2", "Checkins by month"),
                h(AreaChart, { className: "chart", width: 500, height: 300, data: checkins_by_month }, areaArr)
            ]),
            h("div", { className: 'signups_week' }, [
                h("h2", "Signups by week"),
                h(AreaChart, { className: "chart", width: 500, height: 300, data: signups_by_week }, areaArr)
            ]),
            h("div", { className: 'signups_month' }, [
                h("h2", "Signups by month"),
                h(AreaChart, { className: "chart", width: 500, height: 300, data: signups_by_month }, areaArr)
            ]),
            h("div", { className: 'users_week' }, [
                h("h2", "Active Users by week"),
                h(AreaChart, { className: "chart", width: 500, height: 300, data: active_users_by_week }, areaArr)
            ]),
            h("div", { className: 'users_month' }, [
                h("h2", "Active Users by month"),
                h(AreaChart, { className: "chart", width: 500, height: 300, data: active_users_by_month }, areaArr)
            ]),
        ])
    ]);
}