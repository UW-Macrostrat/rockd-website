import h from "@macrostrat/hyper";
import React, { useMemo, useEffect, useState, useRef } from 'react';

import { Group } from "@visx/group"
import { Bar } from "@visx/shape"
import { scaleLinear, scaleBand } from "@visx/scale"
import { Text } from "@visx/text"

const data = [
  { item: "Item 1", amount: 400 },
  { item: "Item 2", amount: 300 },
  { item: "Item 3", amount: 350 },
  { item: "Item 4", amount: 200 },
  { item: "Item 5", amount: 280 }
]

// dimensions and margins
const width = 600
const height = 300
const margin = { top: 10, bottom: 10, left: 10, right: 10 }

// creating bounds
const xMax = width - margin.left - margin.right
const yMax = height - margin.top - margin.bottom

// helpers for accessing the data
const x = (dt) => dt.item
const y = (dt) => +dt.amount

// scaling the graph with the available data
const xScale = scaleBand({
  range: [0, xMax],
  round: true,
  domain: data.map(x),
  padding: 0.4
})
const yScale = scaleLinear({
  range: [yMax, 0],
  round: true,
  domain: [0, Math.max(...data.map(y))]
})

// Calculate point functions
const compose = (scale, accessor) => (data) => scale(accessor(data))
const xPoint = compose(xScale, x)
const yPoint = compose(yScale, y)

export function Example() {
    return h(svg);
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