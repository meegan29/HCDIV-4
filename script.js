let width = 1000, height = 600;

let svg = d3.select("svg")
    .attr("viewBox", "0 0 " + width + " " + height);

// Define color scale
let colorScale = d3.scaleSequential(d3.interpolateYlOrRd) // or use other D3 color schemes
    .domain([0, 10000]); // Adjust the domain based on max population

// Load external data
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

    // Draw the map
    svg.append("g")
        .attr("id", "districts")
        .selectAll("path")
        .data(mapData)
        .enter()
        .append("path")
        .attr("d", geopath)
        .attr("stroke", "black")
        .attr("fill", d => colorScale(d.popdata))
        .on("mouseover", (event, d) => {
            d3.select(event.target).style("stroke", "white").style("stroke-width", 2);
            tooltip.style("visibility", "visible")
                   .text(`${d.properties.Name}: ${d.popdata} people`);
        })
        .on("mousemove", (event) => {
            tooltip.style("top", (event.pageY - 10) + "px")
                   .style("left", (event.pageX + 10) + "px");
        })
        .on("mouseout", (event) => {
            d3.select(event.target).style("stroke", "black").style("stroke-width", 1);
            tooltip.style("visibility", "hidden");
        });

    // Tooltip
    let tooltip = d3.select("body").append("div")
        .attr("class", "tooltip")
        .style("position", "absolute")
        .style("padding", "8px")
        .style("background", "white")
        .style("border", "1px solid #ccc")
        .style("border-radius", "4px")
        .style("visibility", "hidden");

    // Add legend
    let legend = svg.append("g")
        .attr("transform", "translate(20, 450)");

    let legendScale = d3.scaleLinear()
        .domain([0, 10000])
        .range([0, 200]);

    let legendAxis = d3.axisBottom(legendScale)
        .ticks(5);

    legend.selectAll("rect")
        .data(d3.range(0, 10000, 2000))
        .enter()
        .append("rect")
        .attr("x", d => legendScale(d))
        .attr("y", -10)
        .attr("width", 40)
        .attr("height", 10)
        .attr("fill", d => colorScale(d));

    legend.append("g")
        .attr("transform", "translate(0, 0)")
        .call(legendAxis);

    legend.append("text")
        .attr("x", 0)
        .attr("y", -20)
        .text("Population Density")
        .style("font-size", "14px");
});
