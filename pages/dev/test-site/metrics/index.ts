import h from "@macrostrat/hyper";
import React, { useMemo, useEffect, useState, useRef } from 'react';

import { Bar } from '@visx/shape';
import { Group } from '@visx/group';
import { GradientTealBlue } from '@visx/gradient';
import { scaleBand, scaleLinear } from '@visx/scale';

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

    console.log(data.summary);

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
            ]),
            h("div", { className: 'checkins_month' }, [
                h("h2", "Checkins by month"),
            ]),
            h("div", { className: 'signups_week' }, [
                h("h2", "Signups by week"),
            ]),
            h("div", { className: 'signups_month' }, [
                h("h2", "Signups by month"),
            ]),
            h("div", { className: 'users_week' }, [
                h("h2", "Active Users by week"),
            ]),
            h("div", { className: 'users_month' }, [
                h("h2", "Active Users by month"),
            ]),
        ])
    ]);
}