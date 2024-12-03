let width = 1000, height = 600;

let svg = d3.select("svg")
    .attr("viewBox", "0 0 " + width + " " + height)

// Load external data and boot
Promise.all([d3.json("sgmap.json"), d3.csv("population2023.csv")]).then(data => {

    let mapData = data[0].features;
    let popData = data[1];

    // Merge population data with map data
    mapData.forEach(d => {
        let subzone = popData.find(e => e.Subzone.toUpperCase() == d.properties.Name);
        d.popdata = (subzone != undefined) ? parseInt(subzone.Population) : 0;
    });

    // Map and projection
    let projection = d3.geoMercator()
        .center([103.851959, 1.290270])
        .fitExtent([[20, 20], [980, 580]], data[0]);

    let geopath = d3.geoPath().projection(projection);

    // Define a color scale (Colorblind-friendly)
    let colorScale = d3.scaleSequential(d3.interpolateYlGnBu)
        .domain([d3.min(mapData, d => d.popdata), d3.max(mapData, d => d.popdata)]);

    // Draw the districts with color
    svg.append("g")
        .attr("id", "districts")
        .selectAll("path")
        .data(mapData)
        .enter()
        .append("path")
        .attr("d", geopath)
        .attr("stroke", "black")
        .attr("fill", d => colorScale(d.popdata));

    // Create a legend group
    let legendWidth = 300, legendHeight = 20;

    let legend = svg.append("g")
        .attr("class", "legend")
        .attr("transform", "translate(20, 20)");

    // Create a linear scale for the legend axis
    let legendScale = d3.scaleLinear()
        .domain([d3.min(mapData, d => d.popdata), d3.max(mapData, d => d.popdata)])
        .range([0, legendWidth]);

    // Add the gradient to the legend
    legend.append("defs")
        .append("linearGradient")
        .attr("id", "gradient")
        .attr("x1", "0%")
        .attr("y1", "0%")
        .attr("x2", "100%")
        .attr("y2", "0%")
        .selectAll("stop")
        .data(d3.range(0, 1, 1 / 10).map(t => {
            return { offset: t * 100 + "%", color: colorScale(legendScale.invert(t * legendWidth)) };
        }))
        .enter().append("stop")
        .attr("offset", d => d.offset)
        .attr("stop-color", d => d.color);

    // Draw the legend rectangle (color gradient)
    legend.append("rect")
        .attr("width", legendWidth)
        .attr("height", legendHeight)
        .style("fill", "url(#gradient)");

    // Add an axis to the legend
    legend.append("g")
        .attr("transform", "translate(0," + legendHeight + ")")
        .call(d3.axisBottom(legendScale)
            .tickFormat(d3.format(".0s"))
            .ticks(5));

});
