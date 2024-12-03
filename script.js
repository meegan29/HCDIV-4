let width = 1000, height = 600;

// Select the map container and append an SVG element
let svg = d3.select("#map-container")
    .append("svg")
    .attr("width", width)
    .attr("height", height);

// Tooltip setup
let tooltip = d3.select(".tooltip");

// Load external data and boot
Promise.all([d3.json("sgmap.json"), d3.csv("population2023.csv")]).then(data => {

    let mapData = data[0].features;
    let popData = data[1];

    // Merge population data with map data
    mapData.forEach(d => {
        let subzone = popData.find(e => e.Subzone.toUpperCase() == d.properties.Name);
        d.popdata = (subzone != undefined) ? parseInt(subzone.Population) : 0;
    });

    // Check if map data is loaded correctly
    console.log(mapData);

    // Map and projection (adjust to center Singapore properly)
    let projection = d3.geoMercator()
        .center([103.851959, 1.290270]) // Center on Singapore
        .scale(7000) // Adjust scale to make the map fit well in the SVG
        .translate([width / 2, height / 2]); // Center the map in the SVG

    let geopath = d3.geoPath().projection(projection);

    // Define the color scale for population data
    let colorScale = d3.scaleSequential(d3.interpolateYlGnBu)
        .domain([d3.min(mapData, d => d.popdata), d3.max(mapData, d => d.popdata)]);

    // Draw the districts with color fill
    svg.append("g")
        .attr("id", "districts")
        .selectAll("path")
        .data(mapData)
        .enter()
        .append("path")
        .attr("d", geopath)
        .attr("stroke", "white") // Set stroke color to white
        .attr("stroke-width", 0.5)
        .attr("fill", d => colorScale(d.popdata))
        .attr("class", "subzone")
        // Show tooltip on mouseover
        .on("mouseover", function(event, d) {
            tooltip.transition().duration(200).style("opacity", .9);
            tooltip.html(`Subzone: ${d.properties.Name}<br>Population: ${d.popdata.toLocaleString()}`)
                .style("left", (event.pageX + 5) + "px")
                .style("top", (event.pageY - 28) + "px");
        })
        // Hide tooltip on mouseout
        .on("mouseout", function() {
            tooltip.transition().duration(500).style("opacity", 0);
        });

    // Create a new SVG container below the map for the legend
    let legendWidth = 300, legendHeight = 20;

    let legendContainer = d3.select("#legend-container")
        .append("svg")
        .attr("width", width * 0.8)  // Match the map width
        .attr("height", legendHeight + 40) // Add space for labels
        .style("display", "block")
        .style("margin", "0 auto"); // Center the legend container below the map

    let legend = legendContainer.append("g")
        .attr("class", "legend")
        .attr("transform", "translate(30, 10)"); // Position inside the legend container

    // Create a linear scale for the legend axis
    let legendScale = d3.scaleLinear()
        .domain([d3.min(mapData, d => d.popdata), d3.max(mapData, d => d.popdata)])
        .range([0, legendWidth]);

    // Create gradient for the legend
    let gradient = legend.append("defs")
        .append("linearGradient")
        .attr("id", "gradient")
        .attr("x1", "0%")
        .attr("y1", "0%")
        .attr("x2", "100%")
        .attr("y2", "0%");

    // Create gradient stops based on color scale
    gradient.selectAll("stop")
        .data(d3.range(0, 1, 1 / 10).map(t => {
            return {
                offset: `${t * 100}%`,
                color: colorScale(legendScale.invert(t * legendWidth))
            };
        }))
        .enter().append("stop")
        .attr("offset", d => d.offset)
        .attr("stop-color", d => d.color);

    // Add the gradient rectangle to the legend
    legend.append("rect")
        .attr("width", legendWidth)
        .attr("height", legendHeight)
        .style("fill", "url(#gradient)");

    // Add the axis to the legend
    legend.append("g")
        .attr("transform", "translate(0," + legendHeight + ")")
        .call(d3.axisBottom(legendScale)
            .tickFormat(d3.format(".0s"))
            .ticks(5));  // 5 ticks on the axis

});
