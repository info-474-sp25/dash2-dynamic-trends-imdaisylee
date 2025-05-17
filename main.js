// 1: SET GLOBAL VARIABLES
const margin = { top: 50, right: 30, bottom: 60, left: 70 };
const width = 900 - margin.left - margin.right;
const height = 400 - margin.top - margin.bottom;

// Create SVG containers for both charts
const svg = d3.select("#lineChart1") // If you change this ID, you must change it in index.html too
    .append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
    .append("g")
    .attr("transform", `translate(${margin.left},${margin.top})`);


// (If applicable) Tooltip element for interactivity
    const tooltip = d3.select("body")
        .append("div")
        .style("position", "absolute")
        .style("background", "white")
        .style("border", "1px solid #ccc")
        .style("padding", "6px")
        .style("border-radius", "4px")
        .style("display", "none")
        .style("pointer-events", "none");

// 2.a: LOAD...
d3.csv("weather.csv").then(data => {
    // 2.b: ... AND TRANSFORM DATA
    data.forEach(d => {
        d.date = new Date(d.date);
        d.actual_mean_temp = +d.actual_mean_temp;
    });

    const grouped = d3.rollups(
        data,
        v => d3.mean(v, d => d.actual_mean_temp),
        d => +d.date 
    );

    const averagedData = grouped.map(([timestamp, avg]) => ({
        date: new Date(timestamp),
        avgTemp: avg
    }));

    // 3.a: SET SCALES FOR CHART 1
    const x = d3.scaleTime()
    .domain(d3.extent(averagedData, d => d.date))
    .range([0, width]);

    const y = d3.scaleLinear()
        .domain([0, d3.max(averagedData, d => d.avgTemp)])
        .range([height, 0]);


    // 4.a: PLOT DATA FOR CHART 1
    svg.append("path")
    .datum(averagedData)
    .attr("fill", "none")
    .attr("stroke", "steelblue")
    .attr("d", d3.line()
        .x(d => x(d.date))
        .y(d => y(d.avgTemp))
    );

    // 5.a: ADD AXES FOR CHART 1
    svg.append("g").call(d3.axisLeft(y));
    svg.append("g")
        .attr("transform", `translate(0,${height})`)
        .call(d3.axisBottom(x));


    // 6.a: ADD LABELS FOR CHART 1
    svg.append("text")
    .attr("x", width / 2)
    .attr("y", -20)
    .attr("text-anchor", "middle")
    .style("font-size", "16px")

    svg.append("text")
        .attr("x", -height / 2)
        .attr("y", -50)
        .attr("text-anchor", "middle")
        .attr("transform", "rotate(-90)")
        .style("font-size", "12px")
        .text("Average Temperature (°F)");

    svg.append("text")
        .attr("x", width / 2)
        .attr("y", height + 40)
        .attr("text-anchor", "middle")
        .style("font-size", "12px")
        .text("Date");

    // 7.a: ADD INTERACTIVITY FOR CHART 1
    svg.selectAll("dot")
        .data(averagedData)
        .enter()
        .append("circle")
        .attr("cx", d => x(d.date))
        .attr("cy", d => y(d.avgTemp))
        .attr("r", 3)
        .attr("fill", "steelblue")
        .on("mouseover", (event, d) => {
            tooltip
                .style("display", "block")
                .html(`Date: ${d.date.toLocaleDateString()}<br>Avg Temp: ${d.avgTemp.toFixed(1)}°F`);
        })
        .on("mousemove", event => {
            tooltip
                .style("left", (event.pageX + 10) + "px")
                .style("top", (event.pageY - 20) + "px");
        })
        .on("mouseout", () => tooltip.style("display", "none"));

        function getTrendline(data) {
            const n = data.length;
            const sumX = d3.sum(data, d => d.date.getTime());
            const sumY = d3.sum(data, d => d.avgTemp);
            const sumXY = d3.sum(data, d => d.date.getTime() * d.avgTemp);
            const sumX2 = d3.sum(data, d => d.date.getTime() * d.date.getTime());
        
            const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
            const intercept = (sumY - slope * sumX) / n;
        
            const xExtent = d3.extent(data, d => d.date);
            const trendlineData = [
                { date: xExtent[0], avgTemp: slope * xExtent[0].getTime() + intercept },
                { date: xExtent[1], avgTemp: slope * xExtent[1].getTime() + intercept }
            ];
        
            return trendlineData;
        }
        
        const trendlineData = getTrendline(averagedData);
        
        const trendline = svg.append("path")
            .datum(trendlineData)
            .attr("class", "trendline")
            .attr("fill", "none")
            .attr("stroke", "black")
            .attr("stroke-width", 2)
            .attr("d", d3.line()
                .x(d => x(d.date))
                .y(d => y(d.avgTemp))
            );

        d3.select("#trendline-toggle").on("change", function () {
            const isChecked = d3.select(this).property("checked");
            trendline.style("display", isChecked ? null : "none");
        });

});