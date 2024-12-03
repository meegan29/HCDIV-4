let width = 1000, height = 600;

let svg = d3.select("svg")
    .attr("viewBox", "0 0 " + width + " " + height);

// Create a color scale for population with a color-blind friendly palette
let colorScale = d3.scaleSequential()
    .interpolator(d3.interpolateViridis)  // Color-blind friendly palette
    .domain([0, 1000000]);  // Adjust based on population size range

// Load external data and boot
Promise.all([d3.json("sgmap.json"), d3.csv("population2023.csv")]).then(data => {
    let mapData = data[0].features;
    let popData = data[1];

    // Merge population data with map data
    mapData.forEach(d => {
        let subzone = popData.find(e => e.Subzone.toUpperCase() == d.properties.Name);
        d.popdata = (subzone != undefined) ? parseInt(subzone.Population) : 0;
    });

    // Map projection and path generator
    let projection = d3.geoMercator()
        .center([103.851959, 1.290270])
        .fitExtent([[20, 20], [980, 580]], data[0]);

    let geopath = d3.geoPath().projection(projection);

    // Add districts to the map
    svg.append("g")
        .attr("id", "districts")
        .selectAll("path")
        .data(mapData)
        .enter()
        .append("path")
        .attr("d", geopath)
        .attr("stroke", "white")
        .attr("fill", d => colorScale(d.popdata)) // Color by population
        .on("mouseover", function(event, d) {
            d3.select(this).attr("stroke", "white").attr("stroke-width", 2);
            d3.select("#tooltip")
                .style("display", "block")
                .style("left", (event.pageX + 10) + "px")
                .style("top", (event.pageY - 20) + "px")
                .html(`<strong>${d.properties.Name}</strong><br>Population: ${d.popdata}`);
        })
        .on("mouseout", function() {
            d3.select(this).attr("stroke", "black").attr("stroke-width", 1);
            d3.select("#tooltip").style("display", "none");
        });

    // Add a color legend
    let legendWidth = 200, legendHeight = 10;
    let legend = svg.append("g")
        .attr("class", "legend")
        .attr("transform", "translate(800, 30)");

    let legendScale = d3.scaleLinear()
        .domain([0, 1000000])  // Based on the population range
        .range([0, legendWidth]);

    legend.append("g")
        .attr("class", "legend-key")
        .selectAll("rect")
        .data(d3.range(0, 1000000, 100000))  // Adjust for more/less categories
        .enter().append("rect")
        .attr("x", d => legendScale(d))
        .attr("width", legendWidth / 10)
        .attr("height", legendHeight)
        .style("fill", d => colorScale(d));

    legend.append("text")
        .attr("x", 0)
        .attr("y", legendHeight + 20)
        .text("Population");

    // Optional: Add additional labels or breaks for better granularity
});
