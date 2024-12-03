const width = 800;
const height = 600;
const svg = d3.select("svg");
const tooltip = d3.select(".tooltip");

// Load datasets
Promise.all([
    d3.json("sgmap.json"),
    d3.csv("population2023.csv")
]).then(([geoData, populationData]) => {
    // Prepare population data
    const populationMap = {};
    populationData.forEach(d => {
        populationMap[d.Subzone] = +d.Population; // Assuming columns are Subzone and Population
    });

    // Create a color scale
    const maxPopulation = d3.max(populationData, d => +d.Population);
    const colorScale = d3.scaleSequential(d3.interpolateBlues)
        .domain([0, maxPopulation]);

    // Draw the map
    const projection = d3.geoMercator().fitSize([width, height], geoData);
    const path = d3.geoPath().projection(projection);

    svg.selectAll(".subzone")
        .data(geoData.features)
        .join("path")
        .attr("class", "subzone")
        .attr("d", path)
        .attr("fill", d => {
            const population = populationMap[d.properties.Subzone];
            return population ? colorScale(population) : "#ccc";
        })
        .on("mouseover", (event, d) => {
            const subzone = d.properties.Subzone;
            const population = populationMap[subzone] || "Data not available";
            tooltip.transition().style("opacity", 1);
            tooltip.html(`<strong>${subzone}</strong><br>Population: ${population}`)
                .style("left", `${event.pageX + 10}px`)
                .style("top", `${event.pageY - 20}px`);
        })
        .on("mousemove", event => {
            tooltip.style("left", `${event.pageX + 10}px`)
                .style("top", `${event.pageY - 20}px`);
        })
        .on("mouseout", () => {
            tooltip.transition().style("opacity", 0);
        });
});
