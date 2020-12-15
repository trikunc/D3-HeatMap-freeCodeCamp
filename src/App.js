import React, { useEffect, useRef, useState } from "react";
import "./styles.css";
import {
  max,
  min,
  select,
  scaleLinear,
  scaleTime,
  scaleOrdinal,
  axisBottom,
  axisLeft,
  format,
  scaleBand,
  timeFormat,
  scaleThreshold,
  range
} from "d3";

export default function App() {
  const [data, setData] = useState([]);
  const [baseTemp, setBaseTemp] = useState([]);
  const [isTrue, setIsTrue] = useState(false);
  const svgRef = useRef();

  const Months = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "Oktober",
    "November",
    "December"
  ];

  const Colors = [
    "#a50026",
    "#d73027",
    "#f46d43",
    "#fdae61",
    "#fee090",
    "#ffffbf",
    "#e0f3f8",
    "#abd9e9",
    "#74add1",
    "#4575b4",
    "#313695"
  ];

  useEffect(() => {
    fetch(
      "https://raw.githubusercontent.com/freeCodeCamp/ProjectReferenceData/master/global-temperature.json"
    )
      .then((response) => response.json())
      .then((data) => {
        setData(data.monthlyVariance.map((item) => item));
        // setData(data.monthlyVariance.map((item) => item));
        setBaseTemp(data.baseTemperature);
        setIsTrue(true);
      });
  }, []);

  useEffect(() => {
    const width = 900;
    const height = 450;
    const padding = 60;
    const paddingR = 90;
    const paddingL = 30;
    const maxYear = max(data, (d) => d.year);
    const minYear = min(data, (d) => d.year);
    const lengthYear = maxYear - minYear;
    const minTemp = min(data, (d) => d.variance + 8.66);
    const maxTemp = max(data, (d) => d.variance + 8.66);

    const svg = select(svgRef.current)
      .attr("height", height)
      .attr("width", width);

    const xScale = scaleTime()
      .domain([minYear, maxYear + 1])
      .range([paddingR, width - paddingL]);

    const yScale = scaleTime()
      .domain([new Date(0, 0, 0, 0, 0, 0, 0), new Date(0, 12, 0, 0, 0, 0, 0)])
      .range([padding, height - padding]);

    const threshold = scaleThreshold()
      .domain(
        (function (min, max, count) {
          if (min === undefined) return [];
          var array = [];
          var step = (max - min) / count;
          var base = min;
          for (var i = 1; i < count; i++) {
            let arr = parseFloat((base + i * step).toFixed(1));
            // array.push(base + i * step);
            array.push(arr);
          }
          console.log(array, min);
          return array;
        })(minTemp, maxTemp, Colors.length)
      )
      .range(Colors.reverse());

    const xAxis = axisBottom(xScale).tickFormat(format("d"));
    const yAxis = axisLeft(yScale).tickFormat(timeFormat("%B"));

    let tooltip = select("body")
      .append("div")
      .attr("class", "tooltip")
      .style("opacity", 0);

    svg
      .select(".x-axis")
      .attr("transform", `translate(0, ${height - padding})`)
      .call(xAxis);

    svg
      .select(".y-axis")
      .attr("transform", `translate(${paddingR}, 0)`)
      .call(yAxis);

    svg
      .selectAll("rect")
      .data(data)
      .enter()
      .append("rect")
      .attr("class", "cell")
      .attr("fill", function (d) {
        return threshold(d.variance + 8.66);
      })
      .attr("data-month", (d) => d.month - 1)
      .attr("data-year", (d) => d.year)
      .attr("data-temp", (d) => d.variance + baseTemp)
      .attr("height", (height - 2 * padding) / 12)
      .attr("y", (d) => {
        return yScale(new Date(0, d.month - 1, 0, 0, 0, 0, 0));
      })
      .attr("width", (width - 2 * padding) / lengthYear)
      .attr("x", (d) => xScale(d.year))
      .on("mouseover", function (event, value) {
        // const index = svg.selectAll("rect").nodes().indexOf(this);
        let coordinates = [event.pageX, event.pageY];
        console.log(coordinates);

        // select(this).classed("active", true);

        tooltip.transition().duration(200).style("opacity", 0.9);
        tooltip
          .attr("data-year", value.year)
          .attr("id", "tooltip")
          .html(
            `
            <p><strong>${value.year} - ${Months[value.month - 1]}</strong></p>
              <p>${(8.66 + value.variance).toFixed(1)}&#8451;</p>
              <p>${value.variance.toFixed(1)}&#8451;</p>
            `
          )
          .style("left", event.clientX + "px")
          .style("top", coordinates[1] + "px");
      })
      .on("mouseout", function (d) {
        // select(this).classed("active", false);
        tooltip.transition().duration(100).style("opacity", 0);
      });

    // Legend

    svg
      .append("text")
      .attr("text-anchor", "middle")
      .attr("transform", "rotate(-90)")
      .attr("x", -height / 2)
      .attr("y", 22)
      .style("font-size", 18)
      .text("Months");

    svg
      .append("text")
      .attr("text-anchor", "middle")
      .attr("x", (width + paddingL) / 2)
      .attr("y", height - 20)
      .style("font-size", 18)
      .text("Years");

    const legend = svg.append("g").attr("id", "legend");

    const legendColor = (g) => {
      const widthLgd = 260;
      const lengthLgd = threshold.range().length;

      const x = scaleLinear()
        .domain([1, lengthLgd - 1])
        .rangeRound([
          widthLgd / lengthLgd,
          (widthLgd * (lengthLgd - 1)) / lengthLgd
        ]);

      g.selectAll("rect")
        .data(threshold.range())
        .join("rect")
        .attr("height", 8)
        .attr("x", (d, i) => x(i))
        .attr("width", (d, i) => x(i + 1) - x(i))
        .attr("fill", (d) => d);

      g.append("text")
        .attr("y", -6)
        .attr("fill", "currentColor")
        .attr("text-anchor", "start")
        .attr("font-weight", "bold")
        .text("Temperature Range");

      g.call(
        axisBottom(x)
          .tickSize(14)
          .tickFormat((i) => threshold.domain()[i - 1])
      )
        .select(".domain")
        .remove();
    };
    legend.attr("transform", "translate(610,25)").call(legendColor);
  }, [data, baseTemp, Months, Colors]);

  return (
    <div className="App">
      <h1 id="title">Monthly Global Land-Surface Temperature</h1>
      <h3 id="description">
        {`${isTrue && data[0].year} - ${
          isTrue && data[data.length - 1].year
        }: base temperature ${isTrue && baseTemp}`}
        &#8451;
      </h3>
      <svg ref={svgRef} id="legend">
        <g className="x-axis" id="x-axis" />
        <g className="y-axis" id="y-axis" />
      </svg>
    </div>
  );
}
