let width = 1000, height = 600;

let svg = d3.select("svg")
    .attr("viewBox", "0 0 " + width + " " + height)

// Load external data and boot
Promise.all([d3.json("sgmap.json"), d3.csv("population2023.csv")]).then(data => {

    let mapData = data[0].features;
    let popData = data[1];

    // Merge pop data with map data
    mapData.forEach(d => {
        let subzone = popData.find(e => e.Subzone.toUpperCase() == d.properties.Name);
        d.popdata = (subzone != undefined) ? parseInt(subzone.Population) : 0;
    });

    console.log(mapData);

    // Map and projection
    let projection = d3.geoMercator()
        .center([103.851959, 1.290270])
        .fitExtent([[20, 20], [980, 580]], data[0]);

    let geopath = d3.geoPath().projection(projection);

    // Define a color scale
    let colorScale = d3.scaleSequential(d3.interpolateYlGnBu)
        .domain([d3.min(mapData, d => d.popdata), d3.max(mapData, d => d.popdata)]);

    svg.append("g")
        .attr("id", "districts")
        .selectAll("path")
        .data(mapData)
        .enter()
        .append("path")
        .attr("d", geopath)
        .attr("stroke", "black")
        .attr("fill", d => colorScale(d.popdata));

    // Create a legend
    let legend = svg.append("g")
        .attr("class", "legend")
        .attr("transform", "translate(20, 20)");

    let legendWidth = 300, legendHeight = 20;

    let legendScale = d3.scaleLinear()
        .domain([d3.min(mapData, d => d.popdata), d3.max(mapData, d => d.popdata)])
        .range([0, legendWidth]);

    legend.append("g")
        .attr("class", "legendColor")
        .selectAll("rect")
        .data(d3.range(legendWidth))
        .enter()
        .append("rect")
        .attr("x", (d, i) => legendScale(i))
        .attr("y", 0)
        .attr("width", 1)
        .attr("height", legendHeight)
        .attr("fill", d => colorScale(d3.invertExtent(legendScale.domain())[0] + d));

    // Add axis for legend
    legend.append("g")
        .attr("class", "axis")
        .attr("transform", "translate(0," + legendHeight + ")")
        .call(d3.axisBottom(legendScale)
            .tickFormat(d3.format(".0s"))
            .ticks(5));
})
